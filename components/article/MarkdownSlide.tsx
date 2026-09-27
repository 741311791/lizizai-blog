'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * 单页 Markdown 幻灯片渲染。
 * 独立成模块并 dynamic 加载：html_slides 模式的 SlideViewer 不打包 react-markdown。
 */
export default function MarkdownSlide({ markdown }: { markdown: string }) {
  return (
    <div key={markdown.slice(0, 64)} className="text-center px-8 max-w-[85%] prose prose-neutral prose-lg dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
