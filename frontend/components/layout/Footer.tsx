'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/newsletters/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to subscribe');
      }

      setStatus('success');
      setMessage('Successfully subscribed! Check your email for confirmation.');
      setEmail('');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Newsletter subscription */}
        <div className="mb-8 text-center">
          <h3 className="mb-4 text-lg font-semibold">future/proof</h3>
          <p className="mb-4 text-sm text-muted-foreground">stay relevant</p>
          <form onSubmit={handleSubscribe} className="mx-auto max-w-md">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Type your email..."
                className="bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
              />
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </div>
            {message && (
              <p className={`mt-2 text-sm ${
                status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </p>
            )}
          </form>
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
