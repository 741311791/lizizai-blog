'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronRight, Home } from 'lucide-react';
import type { Article } from '@/types/index';

interface ArticleBreadcrumbProps {
  article: Article;
}

export default function ArticleBreadcrumb({ article }: ArticleBreadcrumbProps) {
  const t = useTranslations('breadcrumb');

  const items = [
    { label: t('home'), href: '/' },
    ...(article.category
      ? [{ label: article.category.name, href: `/category/${article.category.slug}` }]
      : []),
  ];

  return (
    <nav aria-label={t('label')} className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((item) => (
        <span key={item.href} className="flex items-center gap-1.5">
          <Link
            href={item.href}
            className="hover:text-foreground transition-colors"
          >
            {item.href === '/' && <Home className="size-3.5" />}
            {item.href !== '/' && item.label}
          </Link>
          <ChevronRight className="size-3" />
        </span>
      ))}
      <span className="text-foreground truncate">{article.title}</span>
    </nav>
  );
}
