'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Twitter, Youtube, Linkedin } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage(t('enterEmail'));
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
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
      setMessage(t('subscribeSuccess'));
      setEmail('');
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : t('subscribeFailed'));
      
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
          <h3 className="mb-3 text-lg font-semibold">Zizai Blog</h3>
          <div className="flex justify-center gap-4 mb-4">
            <a
              href="https://twitter.com/zizaiblog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
            <a
              href="https://youtube.com/@zizaili"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="YouTube"
            >
              <Youtube size={18} />
            </a>
            <a
              href="https://www.linkedin.com/in/zizai-li"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{t('stayRelevant')}</p>
          <form onSubmit={handleSubscribe} className="mx-auto max-w-md">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder={t('emailPlaceholder')}
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
                {status === 'loading' ? t('subscribing') : t('subscribe')}
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
            {t('about')}
          </Link>
          <Link href="/archive" className="hover:text-primary transition-colors">
            {t('archive')}
          </Link>
          <Link href="/recommendations" className="hover:text-primary transition-colors">
            {t('recommendations')}
          </Link>
          <Link href="/sitemap" className="hover:text-primary transition-colors">
            {t('sitemap')}
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            {t('privacy')}
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            {t('terms')}
          </Link>
          <Link href="/collection-notice" className="hover:text-primary transition-colors">
            {t('collectionNotice')}
          </Link>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          {t('copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
