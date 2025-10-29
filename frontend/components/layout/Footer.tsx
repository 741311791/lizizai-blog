'use client';

import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Newsletter subscription */}
        <div className="mb-8 text-center">
          <h3 className="mb-4 text-lg font-semibold">future/proof</h3>
          <p className="mb-4 text-sm text-muted-foreground">stay relevant</p>
          <div className="mx-auto flex max-w-md gap-2">
            <Input
              type="email"
              placeholder="Type your email..."
              className="bg-background"
            />
            <Button className="bg-primary hover:bg-primary/90">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/about" className="hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/archive" className="hover:text-primary transition-colors">
            Archive
          </Link>
          <Link href="/recommendations" className="hover:text-primary transition-colors">
            Recommendations
          </Link>
          <Link href="/sitemap" className="hover:text-primary transition-colors">
            Sitemap
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
          <Link href="/collection-notice" className="hover:text-primary transition-colors">
            Collection notice
          </Link>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Letters Clone. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
