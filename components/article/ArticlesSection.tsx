/**
 * 文章区块 — 网格/列表视图切换
 *
 * 展示最新文章列表。原 latest/top Tab 已移除：top 数据与 latest 相同（死代码），
 * 且 views 已改 client 实时获取（ed8fc0a），服务端无法实现真"热门"排序。
 */

'use client';

import { useState, memo, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Clock, LayoutGrid, List } from 'lucide-react';
import ArticleListItem from '@/components/article/ArticleListItem';
import { getTimeLabel } from '@/lib/content-utils';
import { getCardImageUrl, shouldSkipImageOptimization } from '@/lib/utils/image';
import type { Article } from '@/types/index';

interface ArticlesSectionProps {
  articles: Article[];
}

export default function ArticlesSection({ articles }: ArticlesSectionProps) {
  const t = useTranslations('article');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight">{t('latest')}</h2>

        {/* 视图切换按钮 */}
        <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <ArticleGrid articles={articles} />
      ) : (
        <div className="space-y-0">
          {articles.map((article) => (
            <ArticleListItem key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * 文章网格
 */
function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((article) => (
        <GridCard key={article.id} article={article} />
      ))}
    </div>
  );
}

/**
 * 网格卡片
 * memo：article 引用不变时跳过重渲染（viewMode 切换不触发卡片重渲染）
 * date 用 useMemo 缓存：避免每次渲染都 new Date + toLocaleDateString
 */
const GridCard = memo(function GridCard({ article }: { article: Article }) {
  const locale = useLocale();
  const t = useTranslations('article');
  const imageUrl = getCardImageUrl(article.thumbnailImage, article.featuredImage, article.id);
  const date = useMemo(
    () =>
      article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString(
            locale === 'zh' ? 'zh-CN' : 'en-US',
            { month: 'short', day: 'numeric' }
          )
        : '',
    [article.publishedAt, locale]
  );
  const contentType = article.contentType || 'article';
  const timeLabel = getTimeLabel(t, article.contentType, article.readingTime || 0, article.slideCount);

  return (
    <Link href={`/article/${article.slug}`}>
      <div className="group rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
        {/* 封面图 */}
        <div className="relative aspect-video bg-muted">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={shouldSkipImageOptimization(imageUrl)}
          />
        </div>

        {/* 内容 */}
        <div className="p-4">
          <h3 className="font-semibold text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>

          {/* 标签 */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {article.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.slug}
                  className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-md"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 底部元信息 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">{article.author?.name || '李自在'}</span>
              <span>·</span>
              <span>{date}</span>
            </div>
            {(article.readingTime || contentType === 'slides') && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
