'use client';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Share2, Search, X, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import ShareMenu from '@/components/share/ShareMenu';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { usePagefind } from '@/components/search/usePagefind';
import { config } from '@/lib/env';

const NAV_LINKS = [
  { href: '/', labelKey: 'home' as const },
  { href: '/category/ai', labelKey: 'ai' as const },
  { href: '/category/human-3-0', labelKey: 'human3' as const },
  { href: '/category/premium-course', labelKey: 'premiumCourse' as const },
  { href: '/category/portfolio', labelKey: 'portfolio' as const },
  { href: '/archive', labelKey: 'archive' as const },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, search } = usePagefind();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  // 打开时聚焦，关闭时清空
  useEffect(() => {
    if (searchOpen) {
      // 延迟一帧让动画开始后再 focus
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
    }
  }, [searchOpen]);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  // ESC 关闭搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
      // Cmd/Ctrl+K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [searchOpen]);

  const handleSelect = useCallback((url: string) => {
    setSearchOpen(false);
    router.push(url);
  }, [router]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 shrink-0">
          <Logo size={36} className="transition-transform hover:scale-105" />
          <span className="text-xl font-bold tracking-tight">Zizai Blog</span>
        </Link>

        {/* 右侧按钮 */}
        <div className="flex items-center gap-2" ref={containerRef}>
          {/* 搜索区域 */}
          <div className="flex items-center relative">
            {/* 滑出式搜索输入框 */}
            <div
              className={cn(
                'overflow-hidden rounded-md transition-all duration-300 ease-out',
                searchOpen ? 'w-48 md:w-64 opacity-100 mr-2' : 'w-0 opacity-0'
              )}
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* 搜索按钮 / 关闭按钮 */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={searchOpen ? t('closeSearch') : t('search')}
              onClick={() => setSearchOpen(prev => !prev)}
              className="shrink-0"
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* 搜索结果下拉 */}
            {searchOpen && query && results.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-72 md:w-80 rounded-lg border border-border bg-background shadow-lg overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                {results.map((result) => (
                  <button
                    key={result.url}
                    onClick={() => handleSelect(result.url)}
                    className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                  >
                    <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{result.title}</span>
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
            )}

            {/* 无结果提示 */}
            {searchOpen && query && results.length === 0 && (
              <div className="absolute top-full right-0 mt-2 w-72 md:w-80 rounded-lg border border-border bg-background shadow-lg overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {t('noResults')}
                </div>
              </div>
            )}
          </div>

          <ShareMenu
            title={t('shareTitle')}
            description={t('shareDescription')}
            url={`${config.siteUrl}${pathname}`}
          >
            <Button variant="ghost" size="icon" aria-label={t('share')}>
              <Share2 className="h-5 w-5" />
            </Button>
          </ShareMenu>
          <LanguageSwitcher />
          <Link href="/subscribe" className="hidden md:inline-flex">
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              {t('subscribe')}
            </Button>
          </Link>
          {/* 移动端汉堡菜单 */}
          <MobileNav />
        </div>
      </div>

      {/* 桌面端导航 */}
      <nav className="hidden md:block border-t border-border">
        <div className="container mx-auto max-w-7xl px-4 flex items-center gap-6 py-3 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'hover:text-primary transition-colors relative pb-1',
                isActive(link.href) && 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
