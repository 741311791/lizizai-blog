'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Rss, Copy, Check } from 'lucide-react';
import { siteConfig } from '@/lib/seo';
import { copyToClipboard } from '@/lib/utils/share';
import { FEED_ENABLED_CATEGORIES, getContentType } from '@/lib/rss';
import type { ContentType } from '@/types/index';

interface FeedSubscriptionProps {
  contentType: ContentType;
  categorySlug: string;
  categoryName: string;
}

export default function FeedSubscription({
  contentType,
  categorySlug,
  categoryName,
}: FeedSubscriptionProps) {
  const t = useTranslations('article');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const isCategoryEnabled = (FEED_ENABLED_CATEGORIES as readonly string[]).includes(categorySlug);

  const feedLinks = [
    { label: t('feedAll'), url: `${siteConfig.url}/feed.xml` },
    { label: t('feedByType', { type: contentType }), url: `${siteConfig.url}/feed/${contentType}.xml` },
    ...(isCategoryEnabled
      ? [{ label: t('feedByCategory', { category: categoryName }), url: `${siteConfig.url}/feed/category/${categorySlug}.xml` }]
      : []),
  ];

  const handleCopy = async (url: string) => {
    await copyToClipboard(url);
    setCopiedUrl(url);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
        <Rss className="h-3 w-3" />
        {t('feedLabel')}
      </div>
      <div className="space-y-1.5">
        {feedLinks.map((link) => (
          <div
            key={link.url}
            className="flex items-center justify-between gap-2 rounded-md bg-card px-2.5 py-1.5"
          >
            <span className="text-xs text-muted-foreground truncate">
              {link.label}
            </span>
            <button
              onClick={() => handleCopy(link.url)}
              className="shrink-0 p-1 hover:text-foreground transition-colors"
              aria-label={t('copyFeedUrl')}
            >
              {copiedUrl === link.url ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
