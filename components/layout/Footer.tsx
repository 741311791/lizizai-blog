'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import SocialLinks from '@/components/ui/social-links';
import SubstackEmbed from '@/components/subscribe/SubstackEmbed';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Newsletter subscription — Substack */}
        <div className="mb-8 text-center">
          <h3 className="mb-3 text-lg font-semibold">Zizai Blog</h3>
          <SocialLinks iconSize={18} className="mb-4" />
          <p className="mb-4 text-sm text-muted-foreground">{t('stayRelevant')}</p>
          <div className="mx-auto max-w-md">
            <SubstackEmbed
              variant="form"
              buttonText={t('subscribeOnSubstack')}
              placeholder={t('emailPlaceholder')}
            />
          </div>
        </div>

        {/* Footer links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/about" className="hover:text-primary transition-colors">
            {t('about')}
          </Link>
          <Link href="/archive" className="hover:text-primary transition-colors">
            {t('archive')}
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
