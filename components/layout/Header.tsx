'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
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
        <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 shrink-0">
            <Logo size={36} className="transition-transform hover:scale-105" />
            <span className="text-xl font-bold tracking-tight">Zizai Blog</span>
          </Link>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/subscribe" className="hidden md:inline-flex">
              <Button variant="default" className="bg-primary hover:bg-primary/90">
                {t('subscribe')}
              </Button>
            </Link>
            <MobileNav />
          </div>
        </div>

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
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
