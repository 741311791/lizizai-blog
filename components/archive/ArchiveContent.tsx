'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Calendar, Heart, MessageCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

/** 归档条目：服务端投影后的最小字段集（不下发全文/章节等大对象） */
export interface ArchiveEntry {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  likes: number;
  commentsCount?: number;
  categoryName?: string;
}

export interface ArchiveYearGroup {
  year: string;
  months: Array<{ month: number; articles: ArchiveEntry[] }>;
}

interface ArchiveContentProps {
  groups: ArchiveYearGroup[];
}

// 模块级 formatter 单例：避免每条目每次渲染重建 Intl.DateTimeFormat
const dateFormatters: Record<string, Intl.DateTimeFormat> = {
  zh: new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }),
  en: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }),
};
const monthFormatters: Record<string, Intl.DateTimeFormat> = {
  zh: new Intl.DateTimeFormat('zh-CN', { month: 'long' }),
  en: new Intl.DateTimeFormat('en-US', { month: 'long' }),
};

export default function ArchiveContent({ groups }: ArchiveContentProps) {
  const t = useTranslations('archive');
  const locale = useLocale();
  const lang = locale === 'zh' ? 'zh' : 'en';
  const [searchQuery, setSearchQuery] = useState('');

  // 扁平化一次过滤再分组：query 小写只算一次，避免逐年逐月重复 filter 全扫
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((yearGroup) => ({
        ...yearGroup,
        months: yearGroup.months
          .map((m) => ({ ...m, articles: m.articles.filter((a) => a.title.toLowerCase().includes(q)) }))
          .filter((m) => m.articles.length > 0),
      }))
      .filter((yearGroup) => yearGroup.months.length > 0);
  }, [groups, searchQuery]);

  const hasResults = filteredGroups.length > 0;

  return (
    <>
      {/* Search Bar */}
      <div className="mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>

      {/* Archive Timeline */}
      <div className="space-y-12">
        {filteredGroups.map(({ year, months }) => (
          <div key={year}>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="h-8 w-8" aria-hidden="true" />
              {year}
            </h2>

            <div className="space-y-8">
              {months.map(({ month, articles }) => (
                <div key={month}>
                  <h3 className="text-xl font-semibold mb-4 text-primary">
                    {monthFormatters[lang].format(new Date(Number(year), month - 1, 1))}
                  </h3>
                  <div className="space-y-4 pl-6 border-l-2 border-border">
                    {articles.map((article) => (
                      <div key={article.id} className="pl-6 -ml-px">
                        <Link
                          href={`/article/${article.slug}`}
                          className="block group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold group-hover:text-primary transition-colors">
                                  {article.title}
                                </h4>
                                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground tabular-nums">
                                  <span className="flex items-center gap-1">
                                    {dateFormatters[lang].format(new Date(article.publishedAt))}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" aria-hidden="true" />
                                    {article.likes || 0}
                                  </span>
                                  {article.commentsCount !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" aria-hidden="true" />
                                      {article.commentsCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {article.categoryName && (
                                <Badge variant="secondary" className="shrink-0">
                                  {article.categoryName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Link>
                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {searchQuery && !hasResults && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {t('noResults', { query: searchQuery })}
          </p>
        </div>
      )}
    </>
  );
}
