'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import MobileNav from '@/components/layout/MobileNav';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import SearchDialog from '@/components/search/SearchDialog';

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
  const t = useTranslations('nav');
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 shrink-0">
            <Logo size={36} className="transition-transform hover:scale-105" />
            <span className="text-xl font-bold tracking-tight">Zizai Blog</span>
          </Link>

          {/* 右侧按钮 */}
          <div className="flex items-center gap-2">
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
            <LanguageSwitcher />
            <Link href="/subscribe" className="hidden md:inline-flex">
              <button className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                {t('subscribe')}
              </button>
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
      {/* SearchDialog 全局快捷键监听（组件内部处理 Cmd+K） */}
    </>
  );
}
