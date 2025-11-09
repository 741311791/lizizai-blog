'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import ShareMenu from '@/components/share/ShareMenu';
import { config } from '@/lib/env';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-3">
            <Logo size={36} className="transition-transform hover:scale-105" />
            <span className="text-xl font-bold tracking-tight">Zizai Blog</span>
          </Link>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <ShareMenu
            title="Zizai Blog"
            description="欢迎来到 Zizai Blog，分享技术与生活"
            url={`${config.siteUrl}${pathname}`}
          >
            <Button variant="ghost" size="icon" aria-label="Share">
              <Share2 className="h-5 w-5" />
            </Button>
          </ShareMenu>
          <Link href="/subscribe">
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              Subscribe
            </Button>
          </Link>

        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-border">
        <div className="container mx-auto max-w-7xl px-4 flex items-center gap-6 py-3 text-sm">
          <Link
            href="/"
            className={cn(
              "hover:text-primary transition-colors relative pb-1",
              isActive('/') && pathname === '/' && "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            Home
          </Link>
          <Link
            href="/archive"
            className={cn(
              "hover:text-primary transition-colors relative pb-1",
              isActive('/archive') && "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            Archive
          </Link>
          <Link
            href="/category/ai-prompts"
            className={cn(
              "hover:text-primary transition-colors relative pb-1",
              isActive('/category/ai-prompts') && "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            AI & Prompts
          </Link>
          <Link
            href="/category/premium-course"
            className={cn(
              "hover:text-primary transition-colors relative pb-1",
              isActive('/category/premium-course') && "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            Premium Course
          </Link>
          <Link
            href="/category/portfolio"
            className={cn(
              "hover:text-primary transition-colors relative pb-1",
              isActive('/category/portfolio') && "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            Portfolio
          </Link>
        </div>
      </nav>
    </header>
  );
}
