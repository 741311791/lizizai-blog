'use client';

/**
 * SearchDialogV2 — 全站搜索对话框（编辑风升级版，预览组件）
 * mono 检索标行 + 暖光点缀 + 结果项金色 mono 分类 + 左侧金色游标指示条 + 底部操作提示行
 * 搜索逻辑复用 usePagefind，与 SearchDialog 功能一致（新增 Enter 打开首个结果）
 */

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
import { usePagefind } from '@/components/search/usePagefind';

interface SearchDialogV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialogV2({
  open,
  onOpenChange,
}: SearchDialogV2Props) {
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

  // 关闭（ESC/遮罩/选择结果）时同步清空输入，替代 effect 内 setState
  const handleOpenChange = useCallback(
    (v: boolean) => {
      onOpenChange(v);
      if (!v) setQuery('');
    },
    [onOpenChange]
  );

  const handleSelect = useCallback(
    (url: string) => {
      handleOpenChange(false);
      router.push(url);
    },
    [handleOpenChange, router]
  );

  // Enter 直接打开首个结果
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && results.length > 0) {
        handleSelect(results[0].url);
      }
    },
    [results, handleSelect]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl gap-0 overflow-hidden border-border/80 p-0">
        <DialogTitle className="sr-only">{t('search')}</DialogTitle>

        {/* 顶部：mono 检索标行 + 输入行，暖光点缀 */}
        <div className="relative border-b border-border">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(420px 90px at 20% -30%, rgba(217,119,6,.10), transparent 70%)',
            }}
          />
          <div className="relative flex items-center justify-between px-4 pt-3">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-primary">
              Search
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
              Index · Pagefind
            </p>
          </div>
          <div className="relative flex items-center px-4">
            <Search className="h-4 w-4 shrink-0 text-primary/80" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('searchPlaceholder')}
              className="h-12 border-0 text-sm focus-visible:ring-0"
              autoFocus
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              ESC
            </kbd>
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-72 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.url}
              onClick={() => handleSelect(result.url)}
              className="group relative flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/60"
            >
              {/* 左侧金色游标指示条 */}
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-[2px] origin-top scale-y-0 bg-primary transition-transform duration-200 group-hover:scale-y-100"
              />
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary/80" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="truncate text-sm font-medium">
                    {result.title}
                  </span>
                  {result.meta?.category && (
                    <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-primary/90">
                      {result.meta.category}
                    </span>
                  )}
                </div>
                {result.excerpt && (
                  <p
                    className="mt-1 line-clamp-1 text-xs text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 空态（未输入） */}
        {!query && (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/5">
              <Search className="h-5 w-5 text-primary/70" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted-foreground/80">
              Type to search
            </p>
            <p className="text-xs text-muted-foreground/60">
              {t('searchPlaceholder')}
            </p>
          </div>
        )}

        {/* 无结果 */}
        {query && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-primary">
              0 Results
            </p>
            <p className="text-sm text-muted-foreground">{t('noResults')}</p>
          </div>
        )}

        {/* 底部操作提示行 */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            {!query
              ? 'Ready'
              : loading
                ? 'Searching'
                : `${results.length} Results`}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            ↵ Open · Esc Close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
