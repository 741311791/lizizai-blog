/**
 * 文章区块 — 最新/热门 Tab 切换 + 网格/列表视图
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Clock, LayoutGrid, List } from 'lucide-react';
import ArticleListItem from '@/components/article/ArticleListItem';
import { getArticleImageUrl } from '@/lib/utils/image';
import type { Article } from '@/types/index';

interface ArticlesSectionProps {
  latestArticles: Article[];
  topArticles: Article[];
}

export default function ArticlesSection({
  latestArticles,
  topArticles,
}: ArticlesSectionProps) {
  const t = useTranslations('article');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <section className="py-12">
      <Tabs defaultValue="latest" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="latest">{t('latest')}</TabsTrigger>
            <TabsTrigger value="top">{t('top')}</TabsTrigger>
          </TabsList>

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

        <TabsContent value="latest">
          {viewMode === 'grid' ? (
            <ArticleGrid articles={latestArticles} />
          ) : (
            <div className="space-y-0">
              {latestArticles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="top">
          {viewMode === 'grid' ? (
            <ArticleGrid articles={topArticles} />
          ) : (
            <div className="space-y-0">
              {topArticles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
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
 * 网格卡片组件
 */
function GridCard({ article }: { article: Article }) {
  const locale = useLocale();
  const t = useTranslations('article');
  const imageUrl = getArticleImageUrl(article.featuredImage, article.id);
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        locale === 'zh' ? 'zh-CN' : 'en-US',
        { month: 'short', day: 'numeric' }
      )
    : '';
  const contentType = article.contentType || 'article';

  // 根据内容类型返回不同的时间描述
  const timeLabel =
    contentType === 'podcast'
      ? t('listenTime', { count: article.readingTime || 0 })
      : contentType === 'slides'
      ? t('slideCount', { count: article.slideCount || 0 })
      : t('readingTime', { count: article.readingTime || 0 });

  // 封面图上的标签：优先显示内容类型，其次分类
  const badgeContent =
    contentType === 'podcast'
      ? `🎙️ ${t('podcast')}`
      : contentType === 'slides'
      ? `📊 ${t('slides')}`
      : article.category?.name;

  return (
    <Link href={`/article/${article.slug}`}>
      <div className="group rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
        {/* 封面图 */}
        <div className="relative aspect-video bg-muted">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={imageUrl.includes('picsum.photos')}
          />
          {/* 类型/分类标签 */}
          {badgeContent && (
            <span className="absolute top-2.5 left-2.5 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm">
              {badgeContent}
            </span>
          )}
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
}
