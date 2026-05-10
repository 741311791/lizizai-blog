'use client';

import dynamic from 'next/dynamic';
import { Link, usePathname } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Menu } from 'lucide-react';

// 避免 Radix Dialog useId() hydration mismatch
const MobileNav = dynamic(() => import('@/components/layout/MobileNav'), {
  ssr: false,
  loading: () => (
    <button className="md:hidden p-2" aria-label="菜单">
      <Menu className="h-5 w-5" />
    </button>
  ),
});
const SearchDialog = dynamic(() => import('@/components/search/SearchDialog'), {
  ssr: false,
});

const NAV_LINKS = [
  { href: '/', labelKey: 'home' as const },
  { href: '/daily-news', labelKey: 'aiNews' as const },
  { href: '/category/ai', labelKey: 'ai' as const },
  { href: '/category/human-3-0', labelKey: 'cognition' as const },
  { href: '/category/premium-course', labelKey: 'premiumCourse' as const },
  { href: '/category/portfolio', labelKey: 'portfolio' as const },
  { href: '/archive', labelKey: 'archive' as const },
];

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  // Cmd/Ctrl+K 打开搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between relative">
          {/* Logo 左侧 */}
          <Link href="/" className="flex items-center space-x-2.5 shrink-0">
            <Logo size={32} className="transition-transform hover:scale-105" />
            <span className="text-lg font-bold tracking-tight">Zizai Blog</span>
          </Link>

          {/* 导航居中 — 桌面端 */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm text-muted-foreground hover:text-foreground transition-colors relative py-1',
                  isActive(link.href) && 'text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                )}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {/* 操作右侧 */}
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            <Link href="/subscribe" className="hidden md:inline-flex">
              <span className="text-sm font-medium text-primary border border-primary/40 rounded-lg px-4 py-1.5 hover:bg-primary/8 hover:border-primary transition-all cursor-pointer">
                {t('subscribe')}
              </span>
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
