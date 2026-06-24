'use client';

/**
 * Client 端 Markdown 渲染（react-markdown）
 *
 * 仅用于 client 动态获取的 markdown（如 PodcastList 的播客转录）。
 * 文章正文已由服务端 lib/markdown.ts 预渲染为 HTML，走 ArticleContent（html-only），
 * 不经过此组件，避免 react-markdown/hljs/mermaid 进入文章页初始 client bundle。
 *
 * 注意：此组件被 PodcastList 引用，PodcastList 为 dynamic 加载，故 react-markdown
 * 仅在播客转录展开时才加载。
 */

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { renderMermaidSVG } from 'beautiful-mermaid';
import { visit } from 'unist-util-visit';
import hljs from '@/lib/highlight-config';
import { headingSlug, buildHeadingIdMap } from '@/lib/utils/heading';
import 'highlight.js/styles/github-dark-dimmed.css';
// katex CSS 已在 globals.css 全局导入，此处不再重复

/** 自定义 rehype 插件：拦截 mermaid 代码块，渲染为内联 SVG */
function rehypeMermaid() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (node.tagName !== 'pre' || index === undefined) return;

      const codeChild = node.children?.find(
        (child: any) =>
          child.tagName === 'code' &&
          Array.isArray(child.properties?.className) &&
          child.properties.className.includes('language-mermaid')
      );
      if (!codeChild) return;

      const codeText = codeChild.children
        ?.filter((child: any) => child.type === 'text')
        .map((child: any) => child.value)
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

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const headingIds = useMemo(() => buildHeadingIdMap(content), [content]);

  const getHeadingId = (text: string): string => {
    return headingIds.get(text) || `heading-${headingSlug(text)}`;
  };

  return (
    <article className="max-w-none article-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeMermaid, rehypeRaw, rehypeKatex]}
        components={{
          h1: ({ children, ...props }) => {
            const text = String(children);
            const id = getHeadingId(text);
            return <h1 id={id} className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 mt-8 scroll-mt-24" {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }) => {
            const text = String(children);
            const id = getHeadingId(text);
            return <h2 id={id} className="text-2xl font-bold mb-4 mt-10 scroll-mt-24 leading-[1.4]" {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }) => {
            const text = String(children);
            const id = getHeadingId(text);
            return <h3 id={id} className="text-xl font-semibold mb-3 mt-8 scroll-mt-24 leading-[1.4]" {...props}>{children}</h3>;
          },
          p: ({ ...props }) => (
            <p className="mb-6 text-[17px] leading-[1.8] text-muted-foreground" {...props} />
          ),
          a: ({ ...props }) => (
            <a
              className="text-primary hover:underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          code: ({ className, children, ...props }: any) => {
            const codeText = String(children).replace(/\n$/, '');
            const hasNewline = String(children).includes('\n');
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isCodeBlock = hasNewline || !!match || !!className;

            if (!isCodeBlock) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm font-mono text-primary/80">
                  {children}
                </code>
              );
            }

            try {
              const result = language && hljs.listLanguages().includes(language)
                ? hljs.highlight(codeText, { language })
                : hljs.highlightAuto(codeText);

              return (
                <code
                  className={`hljs ${className || ''}`}
                  style={{ display: 'block' }}
                  dangerouslySetInnerHTML={{ __html: result.value }}
                />
              );
            } catch {
              return (
                <code className={className} style={{ display: 'block' }}>
                  {children}
                </code>
              );
            }
          },
          pre: ({ children }: any) => (
            <div className="code-block-wrapper group relative my-6 rounded-lg overflow-hidden border border-border bg-[#22272e]">
              <pre className="!m-0 !p-4 overflow-x-auto text-sm leading-relaxed">
                {children}
              </pre>
            </div>
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside mb-6 space-y-2 text-[17px] leading-[1.8]" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-outside ml-5 mb-6 space-y-2 text-[17px] leading-[1.8]" {...props} />
          ),
          img: ({ ...props }) => (
            <img className="rounded-lg my-6 w-full" loading="lazy" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className="bg-muted/50" {...props} />
          ),
          th: ({ ...props }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border border-border px-4 py-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
