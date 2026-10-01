/**
 * 服务端 Markdown 渲染（unified pipeline）
 *
 * 替代 client 端 react-markdown：在服务端（ISR 时）将 markdown 预渲染为 HTML，
 * 包含 GFM、数学公式、代码高亮、Mermaid 图表、标题锚点。
 * 这样 client 只需渲染静态 HTML + 轻交互（复制按钮），无需 react-markdown/hljs/mermaid 运行时，
 * 大幅减少 client bundle 与 hydration 成本。
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { renderMermaidSVG } from 'beautiful-mermaid';
import { headingSlug } from '@/lib/utils/heading';

/** rehype/hast AST 节点（局部最小类型：仅声明插件用到的字段；client 侧 type-only 复用） */
export interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/** 提取 hast 节点的纯文本 */
function nodeToText(node: HastNode): string {
  if (node.type === 'text') return node.value || '';
  if (Array.isArray(node.children)) return node.children.map(nodeToText).join('');
  return '';
}

/** rehype 插件：服务端渲染 Mermaid 代码块为内联 SVG */
function rehypeMermaid() {
  return (tree: HastNode) => {
    visit(tree, 'element', (node: HastNode, index: number | undefined, parent: HastNode | undefined) => {
      if (node.tagName !== 'pre' || index === undefined || !parent) return;

      const codeChild = node.children?.find(
        (child: HastNode) =>
          child.tagName === 'code' &&
          Array.isArray(child.properties?.className) &&
          child.properties.className.includes('language-mermaid')
      );
      if (!codeChild) return;

      const codeText =
        codeChild.children
          ?.filter((child: HastNode) => child.type === 'text')
          .map((child: HastNode) => child.value)
          .join('') || '';

      try {
        const svg = renderMermaidSVG(codeText.trim(), {
          fg: 'var(--color-foreground)',
          accent: 'var(--color-primary)',
          muted: 'var(--color-muted-foreground)',
          surface: 'var(--color-muted)',
          border: 'var(--color-border)',
          transparent: true,
        });

        parent.children = parent.children ?? [];
        parent.children[index] = {
          type: 'raw',
          value: `<div class="mermaid-container my-6 overflow-x-auto rounded-lg p-6 bg-muted/50">${svg}</div>`,
        };
      } catch (err) {
        console.warn('Mermaid 渲染失败:', err);
      }
    });
  };
}

/** rehype 插件：为标题生成 id（与 lib/utils/heading 的 extractHeadings 规则保持一致） */
function rehypeHeadingIds() {
  return (tree: HastNode) => {
    const counter = new Map<string, number>();
    visit(tree, 'element', (node: HastNode) => {
      const levelMatch = /^h([1-6])$/.exec(node.tagName || '');
      if (!levelMatch) return;

      const text = nodeToText(node);
      const base = `heading-${headingSlug(text)}`;
      const count = counter.get(base) || 0;
      counter.set(base, count + 1);

      node.properties = node.properties || {};
      node.properties.id = count === 0 ? base : `${base}-${count}`;
    });
  };
}

/** rehype 插件：为正文图片添加懒加载与异步解码（恢复原 react-markdown 的 loading="lazy"） */
function rehypeLazyImages() {
  return (tree: HastNode) => {
    visit(tree, 'element', (node: HastNode) => {
      if (node.tagName === 'img' && node.properties) {
        node.properties.loading = 'lazy';
        node.properties.decoding = 'async';
      }
    });
  };
}

/** 将 markdown 渲染为 HTML 字符串（服务端用） */
export async function renderMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeMermaid)
    .use(rehypeHeadingIds)
    .use(rehypeLazyImages)
    .use(rehypeKatex)
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);

  return String(file);
}
