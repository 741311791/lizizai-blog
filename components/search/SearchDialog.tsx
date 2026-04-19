'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePagefind } from './usePagefind';
import { Badge } from '@/components/ui/badge';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const t = useTranslations('nav');
  const [query, setQuery] = useState('');
  const { results, loading, search } = usePagefind();

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  // ESC 关闭时清空
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const handleSelect = useCallback(
    (url: string) => {
      onOpenChange(false);
      setQuery('');
      router.push(url);
    },
    [onOpenChange, router]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{t('search')}</DialogTitle>
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="border-0 focus-visible:ring-0 h-11 text-sm"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ESC
          </kbd>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-72 overflow-y-auto">
          {query && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('noResults')}
            </div>
          )}

          {results.map((result) => (
            <button
              key={result.url}
              onClick={() => handleSelect(result.url)}
              className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
            >
              <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {result.title}
                  </span>
                  {result.meta?.category && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {result.meta.category}
                    </Badge>
                  )}
                </div>
                {result.excerpt && (
                  <p
                    className="text-xs text-muted-foreground mt-1 line-clamp-1"
                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {!query && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t('searchPlaceholder')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
