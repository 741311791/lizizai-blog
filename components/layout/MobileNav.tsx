'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const NAV_LINKS = [
  { href: '/', labelKey: 'home' as const },
  { href: '/daily-news', labelKey: 'aiNews' as const },
  { href: '/category/ai', labelKey: 'ai' as const },
  { href: '/category/human-3-0', labelKey: 'cognition' as const },
  { href: '/category/premium-course', labelKey: 'premiumCourse' as const },
  { href: '/category/portfolio', labelKey: 'portfolio' as const },
  { href: '/archive', labelKey: 'archive' as const },
];

export default function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('menu')}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Zizai Blog</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'px-3 py-2.5 rounded-md text-sm transition-colors',
                isActive(link.href)
                  ? 'text-primary font-semibold bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="mt-6 pt-6 border-t border-border">
          <Link href="/subscribe" onClick={() => setOpen(false)}>
            <Button className="w-full bg-primary hover:bg-primary/90">
              {t('subscribe')}
            </Button>
          </Link>
          <div className="mt-4">
            <LanguageSwitcher variant="text" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
