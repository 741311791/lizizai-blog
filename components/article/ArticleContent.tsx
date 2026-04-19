'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import hljs from '@/lib/highlight-config';
import { headingSlug, buildHeadingIdMap } from '@/lib/utils/heading';
import MermaidBlock from '@/components/article/MermaidBlock';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  // 预计算 heading ID 映射（确定性，服务端/客户端结果一致）
  const headingIds = useMemo(() => buildHeadingIdMap(content), [content]);

  const getHeadingId = (text: string): string => {
    return headingIds.get(text) || `heading-${headingSlug(text)}`;
  };

  return (
    <article className="prose prose-invert prose-lg max-w-none article-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          h1: ({ node, children, ...props }) => {
            const text = String(children);
            const id = getHeadingId(text);
            return <h1 id={id} className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 mt-8 scroll-mt-24" {...props}>{children}</h1>;
          },
          h2: ({ node, children, ...props }) => {
            const text = String(children);
            const id = getHeadingId(text);
            return <h2 id={id} className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 mt-8 scroll-mt-24" {...props}>{children}</h2>;
          },
          h3: ({ node, children, ...props }) => {
            const text = String(children);
            const id = getHeadingId(text);
            return <h3 id={id} className="text-lg md:text-xl lg:text-2xl font-semibold mb-3 mt-6 scroll-mt-24" {...props}>{children}</h3>;
          },
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-relaxed text-muted-foreground" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({ node, children, ...props }) => {
            // 检测 callout 格式：blockquote 首个子节点以 emoji 开头
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
              />
            );
          },
          code: ({ node, className, children, ...props }: any) => {
            // react-markdown v10 不提供 inline 属性
            // 判断是否为代码块：
            // 1. 有 language-xxx className（明确是代码块）
            // 2. 内容包含换行符（代码块通常是多行的）
            // 3. className 存在但不是 language-（可能是其他代码块样式）
            const codeText = String(children).replace(/\n$/, '');
            const hasNewline = String(children).includes('\n');
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            // 如果有语言标识或有换行符，则认为是代码块
            const isCodeBlock = hasNewline || !!match || !!className;

            // Mermaid 图表渲染（仅代码块）
            if (isCodeBlock && language === 'mermaid') {
              return <MermaidBlock code={codeText} />;
            }

            // 行内代码
            if (!isCodeBlock) {
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                >
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
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img
              className="rounded-lg my-6 w-full"
              loading="lazy"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted/50" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-border px-4 py-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
