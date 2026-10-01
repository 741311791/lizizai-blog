'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ArticleGrid from '@/components/article/ArticleGrid';
import ArticleListItem from '@/components/ui-v2/ArticleListItemV2';
import LayoutToggle from '@/components/ui-v2/LayoutToggleV2';
import ContentTypeFilter, { type ContentTypeFilter as FilterValue } from '@/components/article/ContentTypeFilter';
import { useViewMode } from '@/hooks/useViewMode';
import type { Article, ContentType } from '@/types/index';

interface CategoryArticlesSectionProps {
  articles: Article[];
}

/** 初始渲染条数：超出部分滚动到哨兵时增量挂载，避免长列表一次全渲染 */
const INITIAL_COUNT = 24;
const LOAD_STEP = 24;

type SortMode = 'latest' | 'top' | 'trending';

/** 判断文章是否包含指定内容类型（一篇文章可同时有 podcast + slides + article） */
function hasContentType(article: Article, type: ContentType): boolean {
  const ct = article.contentTypes;
  if (type === 'podcast') return ct ? !!ct.podcast : article.contentType === 'podcast';
  if (type === 'slides') return ct ? !!ct.slides : article.contentType === 'slides';
  if (type === 'html') return ct ? !!ct.html : article.contentType === 'html';
  // article: 所有文章都是可阅读的文章
  return true;
}

/** 获取文章的所有内容类型标签（用于计数，article 始终包含） */
function getTypeTags(article: Article): ContentType[] {
  const ct = article.contentTypes;
  const hasPodcast = ct ? !!ct.podcast : article.contentType === 'podcast';
  const hasSlides = ct ? !!ct.slides : article.contentType === 'slides';
  const hasHtml = ct ? !!ct.html : article.contentType === 'html';
  const result: ContentType[] = ['article'];
  if (hasPodcast) result.push('podcast');
  if (hasSlides) result.push('slides');
  if (hasHtml) result.push('html');
  return result;
}

export default function CategoryArticlesSection({
  articles,
}: CategoryArticlesSectionProps) {
  const t = useTranslations('article');
  const [viewMode, setViewMode] = useViewMode('list');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 按内容类型计数（一篇文章可归属多个类型）
  const counts = useMemo(() => {
    const result: Record<FilterValue, number> = { all: articles.length, article: 0, podcast: 0, slides: 0, html: 0 };
    for (const article of articles) {
      for (const tag of getTypeTags(article)) {
        result[tag]++;
      }
    }
    return result;
  }, [articles]);

  // 按筛选条件过滤
  const filteredArticles = useMemo(() => {
    if (activeFilter === 'all') return articles;
    return articles.filter((a) => hasContentType(a, activeFilter as ContentType));
  }, [articles, activeFilter]);

  // 时间戳预计算：排序比较 O(n log n) 次不再重复 new Date
  const timeMap = useMemo(
    () => new Map(articles.map((a) => [a.id, new Date(a.publishedAt).getTime()])),
    [articles]
  );

  // 单一排序 state 渲染一份列表：切换排序只重排，不卸载/重挂全部条目
  const sortedArticles = useMemo(() => {
    const list = [...filteredArticles];
    if (sortMode === 'top') {
      list.sort((a, b) => b.likes - a.likes);
    } else if (sortMode === 'trending') {
      list.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
    } else {
      list.sort((a, b) => (timeMap.get(b.id) ?? 0) - (timeMap.get(a.id) ?? 0));
    }
    return list;
  }, [filteredArticles, sortMode, timeMap]);

  const hasMore = sortedArticles.length > visibleCount;
  const displayedArticles = useMemo(
    () => sortedArticles.slice(0, visibleCount),
    [sortedArticles, visibleCount]
  );

  // 哨兵进入视口时增量挂载下一批
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + LOAD_STEP);
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // 是否有多种内容类型（只有单一类型时隐藏筛选器；html 也计入）
  const hasMultipleTypes =
    (counts.article > 0 ? 1 : 0) +
      (counts.podcast > 0 ? 1 : 0) +
      (counts.slides > 0 ? 1 : 0) +
      (counts.html > 0 ? 1 : 0) >
    1;

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: 'latest', label: t('latest') },
    { value: 'top', label: t('top') },
    { value: 'trending', label: t('trending') },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div
          role="group"
          aria-label={t('sortLabel')}
          className="inline-flex items-center gap-1 bg-muted rounded-lg p-1"
        >
          {sortOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSortMode(value)}
              aria-pressed={sortMode === value}
              className={`h-9 px-4 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                sortMode === value
                  ? 'bg-card text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="hidden sm:block">
          <LayoutToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {hasMultipleTypes && (
        <div className="mb-6">
          <ContentTypeFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />
        </div>
      )}

      {displayedArticles.length > 0 ? (
        viewMode === 'grid' ? (
          <ArticleGrid articles={displayedArticles} variant="default" />
        ) : (
          <div className="space-y-0">
            {displayedArticles.map((article, index) => (
              // cv-row: 视口外行跳过渲染，长列表滚动更流畅
              <div key={article.id} className="cv-row">
                <ArticleListItem article={article} priority={index === 0 && visibleCount <= INITIAL_COUNT} />
              </div>
            ))}
          </div>
        )
      ) : (
        <p className="text-center text-muted-foreground py-12">{t('noArticlesInFilter')}</p>
      )}

      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px" />}
    </div>
  );
}
