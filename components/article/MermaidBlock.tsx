'use client';

import { useMemo } from 'react';
import { renderMermaidSVG, THEMES } from 'beautiful-mermaid';

interface MermaidBlockProps {
  code: string;
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const svgHtml = useMemo(() => {
    try {
      return renderMermaidSVG(code.trim(), {
        ...THEMES['github-dark'],
        transparent: true,
      });
    } catch (err) {
      console.error('Mermaid render error:', err);
      return null;
    }
  }, [code]);

  if (!svgHtml) {
    // 渲染失败时回退为代码块
    return (
      <div className="my-6 p-4 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">Mermaid 图表渲染失败</p>
        <pre className="text-sm overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
