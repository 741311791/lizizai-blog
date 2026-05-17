'use client';

import { Mic, Presentation, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { ContentType } from '@/types/index';

export type ContentTypeFilter = ContentType | 'all';

interface ContentTypeFilterProps {
  activeFilter: ContentTypeFilter;
  onFilterChange: (filter: ContentTypeFilter) => void;
  counts: Record<ContentTypeFilter, number>;
}

const FILTER_OPTIONS: { value: ContentTypeFilter; icon: typeof FileText; labelKey: string }[] = [
  { value: 'all', icon: FileText, labelKey: 'filterAll' },
  { value: 'article', icon: FileText, labelKey: 'filterArticle' },
  { value: 'podcast', icon: Mic, labelKey: 'filterPodcast' },
  { value: 'slides', icon: Presentation, labelKey: 'filterSlides' },
];

export default function ContentTypeFilter({
  activeFilter,
  onFilterChange,
  counts,
}: ContentTypeFilterProps) {
  const t = useTranslations('article');

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {FILTER_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
        const count = counts[value] || 0;
        if (count === 0 && value !== 'all') return null;

        const isActive = activeFilter === value;
        return (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            )}
          >
            <Icon className="size-3.5" />
            <span>{t(labelKey)}</span>
            <span className="text-xs opacity-70">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
