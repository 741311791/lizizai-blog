'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';
import { siteConfig } from '@/lib/seo';
import { copyToClipboard } from '@/lib/utils/share';
import { FEED_ENABLED_CATEGORIES } from '@/lib/rss';
import type { ContentType } from '@/types/index';
import SidebarSectionTitle from './SidebarSectionTitle';

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
      <SidebarSectionTitle eyebrow="RSS" title={t('feedLabel')} />
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
              className="relative shrink-0 size-10 flex items-center justify-center hover:text-foreground transition-colors"
              aria-label={t('copyFeedUrl')}
            >
              {/* 两图标叠放 cross-fade:150ms,匹配交互反馈规范 */}
              <Copy className={`absolute h-3.5 w-3.5 text-muted-foreground transition-opacity duration-150 ${copiedUrl === link.url ? 'opacity-0' : 'opacity-100'}`} />
              <Check className={`absolute h-3.5 w-3.5 text-green-500 transition-opacity duration-150 ${copiedUrl === link.url ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
