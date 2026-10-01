/**
 * 文章区块 — 最新/热门 Tab + 网格/列表视图
 *
 * 热门排序：client 端批量获取 Webviso 浏览量后按 views 降序排序。
 * 保持首页 ISR 静态（views 不进服务端数据流，符合 ed8fc0a 的 views client 化方向）。
 */

'use client';

import { useState, memo, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Clock, LayoutGrid, List } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ArticleListItem from '@/components/ui-v2/ArticleListItemV2';
import ContentTypeBadge from '@/components/ui-v2/ContentTypeBadgeV2';
import { getTimeLabel } from '@/lib/content-utils';
import CardTechAccent from '@/components/ui-v2/CardTechAccent';
import { getCardImageUrl, shouldSkipImageOptimization } from '@/lib/utils/image';
import { getBatchViews, isWebvisoEnabled } from '@/lib/services';
import type { Article } from '@/types/index';

interface ArticlesSectionProps {
  articles: Article[];
}

export default function ArticlesSection({ articles }: ArticlesSectionProps) {
  const t = useTranslations('article');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 热门排序：client 端批量获取浏览量（进入页面即预取，切 tab 即时显示）
  // Webviso 未启用时初始即视为已加载，避免 effect 内同步 setState
  const [viewsMap, setViewsMap] = useState<Record<string, number>>({});
  const [viewsLoaded, setViewsLoaded] = useState(() => !isWebvisoEnabled() || articles.length === 0);

  useEffect(() => {
    if (viewsLoaded || articles.length === 0) return;
    let cancelled = false;
    getBatchViews(articles.map((a) => a.id)).then((map) => {
      if (cancelled) return;
      setViewsMap(map);
      setViewsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [articles, viewsLoaded]);

  const topArticles = useMemo(
    () =>
      [...articles].sort(
        (a, b) => (viewsMap[b.id] || 0) - (viewsMap[a.id] || 0)
      ),
    [articles, viewsMap]
  );

  return (
    <section className="py-12">
      <Tabs defaultValue="latest" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="latest">{t('latest')}</TabsTrigger>
            <TabsTrigger value="top">{t('top')}</TabsTrigger>
          </TabsList>

          {/* 视图切换按钮 — 40px 命中区,aria-pressed 表达当前状态 */}
          <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              aria-label={t('viewGrid')}
              aria-pressed={viewMode === 'grid'}
              className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label={t('viewList')}
              aria-pressed={viewMode === 'list'}
              className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 最新：按发布时间降序（服务端已排序） */}
        <TabsContent value="latest">
          {viewMode === 'grid' ? (
            <ArticleGrid articles={articles} />
          ) : (
            <ArticleList articles={articles} />
          )}
        </TabsContent>

        {/* 热门：按浏览量降序（client 端获取后排序），骨架随 viewMode 呈对应形态 */}
        <TabsContent value="top">
          {!viewsLoaded ? (
            viewMode === 'grid' ? (
              <LoadingGrid />
            ) : (
              <LoadingList />
            )
          ) : viewMode === 'grid' ? (
            <ArticleGrid articles={topArticles} />
          ) : (
            <ArticleList articles={topArticles} />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

/** 文章列表（列表视图） */
function ArticleList({ articles }: { articles: Article[] }) {
  return (
    <div className="space-y-0">
      {articles.map((article, index) => (
        <ArticleListItem key={article.id} article={article} priority={index === 0} />
      ))}
    </div>
  );
}

/** 文章网格 */
function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((article) => (
        <GridCard key={article.id} article={article} />
      ))}
    </div>
  );
}

/** 热门数据加载骨架 — 网格形态（views 获取中） */
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card overflow-hidden"
        >
          <div className="aspect-video bg-muted animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 热门数据加载骨架 — 列表形态（与 ArticleList 行结构一致，避免加载完成跳变） */
function LoadingList() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 sm:gap-6 py-4 sm:py-6 border-b border-border">
          <div className="flex-1 space-y-3">
            <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          </div>
          <div className="w-24 h-24 sm:w-40 sm:h-40 rounded-lg bg-muted animate-pulse flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * 网格卡片
 * memo：article 引用不变时跳过重渲染（Tab/viewMode 切换不触发卡片重渲染）
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
      <div className="group relative rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
        {/* 科技感点缀：hover 电路节点 + 扫光 */}
        <CardTechAccent />
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

          {/* 内容类型标识 + 标签 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <ContentTypeBadge article={article} compact />
            {article.tags && article.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.slug}
                className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-md"
              >
                {tag.name}
              </span>
            ))}
          </div>

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
