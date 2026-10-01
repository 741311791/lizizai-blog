'use client';

import dynamic from 'next/dynamic';
import { Link, usePathname } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { Menu, FileText } from 'lucide-react';

// 动态加载占位：与 MobileNav 触发按钮一致的 i18n 标签
function MobileNavPlaceholder() {
  const t = useTranslations('nav');
  return (
    <button className="xl:hidden p-2" aria-label={t('menu')}>
      <Menu className="h-5 w-5" />
    </button>
  );
}

// 避免 Radix Dialog useId() hydration mismatch
const MobileNav = dynamic(() => import('@/components/ui-v2/MobileNavV2'), {
  ssr: false,
  loading: () => <MobileNavPlaceholder />,
});
const SearchDialog = dynamic(() => import('@/components/ui-v2/SearchDialogV2'), {
  ssr: false,
});

const NAV_LINKS: { href: string; labelKey: 'home' | 'aiNews' | 'ai' | 'cognition' | 'premiumCourse' | 'portfolio' | 'archive' | 'resume'; accent?: boolean }[] = [
  { href: '/', labelKey: 'home' },
  { href: '/daily-news', labelKey: 'aiNews' },
  { href: '/category/ai', labelKey: 'ai' },
  { href: '/category/human-3-0', labelKey: 'cognition' },
  { href: '/category/premium-course', labelKey: 'premiumCourse' },
  { href: '/category/portfolio', labelKey: 'portfolio' },
  { href: '/archive', labelKey: 'archive' },
  { href: '/resume', labelKey: 'resume', accent: true },
];

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [searchOpen, setSearchOpen] = useState(false);
  // 首次打开后才挂载 SearchDialog chunk；关闭时等退出动画结束再卸载
  const [searchMounted, setSearchMounted] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const handleSearchOpenChange = (open: boolean) => {
    setSearchOpen(open);
    if (open) {
      setSearchMounted(true);
    } else {
      setTimeout(() => setSearchMounted(false), 250);
    }
  };

  // Cmd/Ctrl+K 打开搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleSearchOpenChange(!searchOpen);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between relative">
          {/* Logo 左侧 */}
          <Link href="/" className="flex items-center space-x-2.5 shrink-0">
            <Logo size={32} className="transition-transform hover:scale-105" />
            <span className="text-lg font-bold tracking-tight">Zizai Blog</span>
          </Link>

          {/* 导航居中 — 桌面端（≥1280px：英文整行导航较宽，1024–1280 放不下，改走移动菜单。
              全宽 inset-x-0 + justify-center 居中：left-1/2 定位的收缩宽度以锚点右侧空间为限，英文标签必然换行 */}
          <nav className="hidden xl:flex absolute inset-x-0 items-center justify-center gap-5 2xl:gap-7 pointer-events-none">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm relative py-1 transition-colors whitespace-nowrap pointer-events-auto',
                  link.accent
                    ? 'inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/[0.08] px-3 font-semibold text-primary hover:bg-primary/15'
                    : 'text-muted-foreground hover:text-foreground',
                  isActive(link.href) && !link.accent &&
                    'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full',
                  isActive(link.href) && !link.accent && 'text-primary font-semibold',
                  isActive(link.href) && link.accent && 'border-primary bg-primary/15'
                )}
              >
                {link.accent && <FileText className="h-3.5 w-3.5" aria-hidden="true" />}
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {/* 操作右侧 */}
          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            <Link href="/subscribe" className="hidden md:inline-flex">
              <span className="text-sm font-medium text-primary border border-primary/40 rounded-lg px-4 py-1.5 transition-[color,background-color,border-color] hover:bg-primary/8 hover:border-primary cursor-pointer">
                {t('subscribe')}
              </span>
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>
      {searchMounted && (
        <SearchDialog open={searchOpen} onOpenChange={handleSearchOpenChange} />
      )}
    </>
  );
}
