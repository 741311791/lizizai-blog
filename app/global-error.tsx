'use client';

import { useEffect } from 'react';

/**
 * 全局错误兜底：根 layout 级错误时渲染（此时 i18n Provider 不可用，文案随站点默认语言中文）
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="zh-CN" className="dark">
      <body className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
        <div className="max-w-lg w-full rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold text-destructive mb-2">出错了</h1>
          <p className="text-sm text-muted-foreground mb-6">
            抱歉，页面发生了意外错误。请重试，或稍后再来看看。
          </p>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
