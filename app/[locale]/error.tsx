'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('error');

  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-destructive">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
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
              {t('retry')}
            </Button>
            <Button onClick={() => (window.location.href = '/')} variant="outline">
              {t('goHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
