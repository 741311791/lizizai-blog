'use client';

/**
 * 文章正文渲染（接收服务端预渲染的 HTML）
 *
 * HTML 由 lib/markdown.ts 在服务端（ISR 时）产出，含 GFM/数学/代码高亮/Mermaid/锚点。
 * 本组件仅负责渲染静态 HTML + 注入代码块复制按钮（轻量 client 交互），
 * 不引入 react-markdown/hljs/mermaid 运行时，大幅减少 client bundle。
 * 排版样式由 globals.css 的 .article-content 规则提供。
 */

import { useEffect, useRef } from 'react';
import 'highlight.js/styles/github-dark-dimmed.css';
// katex CSS 已在 globals.css 全局导入，此处不再重复

interface ArticleContentProps {
  html: string;
}

export default function ArticleContent({ html }: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 为每个代码块注入复制按钮 + 语言标签（复用原 CodeBlockWrapper 样式）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pres = container.querySelectorAll<HTMLPreElement>('pre');
    pres.forEach(pre => {
      // 跳过已被包装的（mermaid 已替换为 div，不含 pre）
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

      const code = pre.querySelector('code');
      if (!code) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper group relative my-6 rounded-lg overflow-hidden border border-border bg-[#22272e]';

      const toolbar = document.createElement('div');
      toolbar.className = 'flex items-center justify-between px-4 py-2 bg-[#1c2128] border-b border-border text-xs text-muted-foreground';

      const match = /language-(\w+)/.exec(code.className || '');
      const lang = match ? match[1] : 'code';

      const label = document.createElement('span');
      label.className = 'font-medium';
      label.textContent = lang;

      const btn = document.createElement('button');
      btn.className = 'opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground px-2 py-0.5 rounded hover:bg-muted/50';
      btn.setAttribute('aria-label', '复制代码');
      btn.textContent = '复制';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(code.textContent || '');
        btn.textContent = '已复制';
        window.setTimeout(() => {
          btn.textContent = '复制';
        }, 1500);
      });

      toolbar.appendChild(label);
      toolbar.appendChild(btn);

      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(toolbar);
      wrapper.appendChild(pre);
      pre.className = '!m-0 !p-4 overflow-x-auto text-sm leading-relaxed';
    });
  }, [html]);

  return (
    <article className="max-w-none article-content">
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
