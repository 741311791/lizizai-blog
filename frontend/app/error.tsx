/**
 * 全局错误页面
 *
 * Next.js App Router 错误处理页面
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { config } from '@/lib/env';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Something went wrong!</CardTitle>
          <CardDescription>
            We apologize for the inconvenience. An unexpected error has occurred.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.isDevelopment && (
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-mono text-destructive mb-2">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = '/')} variant="outline">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
