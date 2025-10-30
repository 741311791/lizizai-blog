'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import UserMenu from '@/components/auth/UserMenu';

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
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">FUTURE/PROOF</span>
          </Link>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Share">
            <Share2 className="h-5 w-5" />
          </Button>
          <Link href="/subscribe">
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              Subscribe
            </Button>
          </Link>
          <UserMenu />
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
            href="/chat" 
            className={cn(
              "hover:text-primary transition-colors relative pb-1",
              isActive('/chat') && "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            Chat
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
            href="/category/marketing-strategies" 
            className={cn(
              "hover:text-primary transition-colors relative pb-1",
              isActive('/category/marketing-strategies') && "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
            )}
          >
            Marketing Strategies
          </Link>
        </div>
      </nav>
    </header>
  );
}
