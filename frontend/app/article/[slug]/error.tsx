/**
 * 文章页面错误处理
 *
 * 为文章页面提供专门的错误处理
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误
    console.error('Article page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Failed to load article</h1>
          <p className="text-xl text-muted-foreground max-w-md">
            {error.message || 'An unexpected error occurred while loading this article'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={reset} size="lg">
            Try Again
          </Button>
          <Button onClick={() => (window.location.href = '/')} variant="outline" size="lg">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
