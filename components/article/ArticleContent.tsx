'use client';

import { useMemo, useRef, useCallback } from 'react';
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
import 'katex/dist/katex.min.css';

/**
 * 自定义 rehype 插件：拦截 mermaid 代码块，
 * 使用 beautiful-mermaid 渲染为内联 SVG
 */
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

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
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
          blockquote: ({ children, ...props }) => {
            const childText = typeof children === 'string' ? children : '';
            const isCallout = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(childText.trim());

            if (isCallout) {
              return (
                <blockquote
                  className="my-6 p-4 rounded-lg border-l-4 bg-muted/30 not-italic"
                  {...props}
                >
                  {children}
                </blockquote>
              );
            }

            return (
              <blockquote
                className="border-l-4 border-primary pl-4 italic my-6 text-muted-foreground"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          code: ({ className, children, ...props }: any) => {
            const codeText = String(children).replace(/\n$/, '');
            const hasNewline = String(children).includes('\n');
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isCodeBlock = hasNewline || !!match || !!className;

            // 行内代码
            if (!isCodeBlock) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded-sm text-sm font-mono text-primary/80">
                  {children}
                </code>
              );
            }

            // 代码块：使用 hljs 高亮
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
          pre: ({ children, ...props }: any) => (
            <CodeBlockWrapper {...props}>{children}</CodeBlockWrapper>
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside mb-6 space-y-2 text-[17px] leading-[1.8]" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-outside ml-5 mb-6 space-y-2 text-[17px] leading-[1.8]" {...props} />
          ),
          img: ({ ...props }) => (
            <img
              className="rounded-lg my-6 w-full"
              loading="lazy"
              {...props}
            />
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

/**
 * 代码块包装器：提供复制按钮和语言标签
 */
function CodeBlockWrapper({ children, ...props }: any) {
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = useCallback(() => {
    const codeEl = preRef.current?.querySelector('code');
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent || '');
    }
  }, []);

  // 从子元素 className 中提取语言
  const getChildLanguage = () => {
    try {
      const codeChild = (children as any)?.props?.className;
      const match = /language-(\w+)/.exec(codeChild || '');
      return match ? match[1] : '';
    } catch {
      return '';
    }
  };

  const lang = getChildLanguage();

  return (
    <div className="code-block-wrapper group relative my-6 rounded-lg overflow-hidden border border-border bg-[#22272e]">
      {/* 顶部栏：语言标签 + 复制按钮 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1c2128] border-b border-border text-xs text-muted-foreground">
        <span className="font-medium">{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground px-2 py-0.5 rounded hover:bg-muted/50"
          aria-label="复制代码"
        >
          复制
        </button>
      </div>
      <pre
        ref={preRef}
        className="!m-0 !p-4 overflow-x-auto text-sm leading-relaxed"
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}
