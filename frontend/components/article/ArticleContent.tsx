'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  return (
    <article className="prose prose-invert prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          h1: ({ node, children, ...props }) => {
            const text = String(children);
            const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return <h1 id={id} className="text-4xl font-bold mb-6 mt-8 scroll-mt-24" {...props}>{children}</h1>;
          },
          h2: ({ node, children, ...props }) => {
            const text = String(children);
            const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return <h2 id={id} className="text-3xl font-bold mb-4 mt-8 scroll-mt-24" {...props}>{children}</h2>;
          },
          h3: ({ node, children, ...props }) => {
            const text = String(children);
            const id = `heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            return <h3 id={id} className="text-2xl font-semibold mb-3 mt-6 scroll-mt-24" {...props}>{children}</h3>;
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
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-primary pl-4 italic my-6 text-muted-foreground" 
              {...props} 
            />
          ),
          code: ({ node, inline, ...props }: any) => 
            inline ? (
              <code 
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" 
                {...props} 
              />
            ) : (
              <code className="block" {...props} />
            ),
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
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
