'use client';

import Link from 'next/link';
import { Search, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
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
          <Button variant="default" className="bg-primary hover:bg-primary/90">
            Subscribe
          </Button>
          <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
            Sign in
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t border-border">
        <div className="container flex items-center gap-6 py-3 text-sm">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/chat" className="hover:text-primary transition-colors">
            Chat
          </Link>
          <Link href="/category/ai-prompts" className="hover:text-primary transition-colors">
            AI & Prompts
          </Link>
          <Link href="/category/writing-strategies" className="hover:text-primary transition-colors">
            Writing Strategies
          </Link>
          <Link href="/category/marketing-strategies" className="hover:text-primary transition-colors">
            Marketing Strategies
          </Link>
          <Link href="/category/human-3-0" className="hover:text-primary transition-colors">
            HUMAN 3.0
          </Link>
        </div>
      </nav>
    </header>
  );
}
