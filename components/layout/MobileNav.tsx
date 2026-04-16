'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/category/ai', label: 'AI' },
  { href: '/category/human-3-0', label: 'HUMAN 3.0' },
  { href: '/category/premium-course', label: 'Premium Course' },
  { href: '/category/portfolio', label: 'Portfolio' },
  { href: '/archive', label: 'Archive' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="菜单">
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
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 pt-6 border-t border-border">
          <Link href="/subscribe" onClick={() => setOpen(false)}>
            <Button className="w-full bg-primary hover:bg-primary/90">
              Subscribe
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
