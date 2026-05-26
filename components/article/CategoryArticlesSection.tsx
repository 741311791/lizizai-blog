'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ArticleGrid from '@/components/article/ArticleGrid';
import ArticleListItem from '@/components/article/ArticleListItem';
import LayoutToggle from '@/components/article/LayoutToggle';
import ContentTypeFilter, { type ContentTypeFilter as FilterValue } from '@/components/article/ContentTypeFilter';
import { useViewMode } from '@/hooks/useViewMode';
import type { Article, ContentType } from '@/types/index';

interface CategoryArticlesSectionProps {
  articles: Article[];
}

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
  const [viewMode, setViewMode] = useViewMode('list');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

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

  // 排序
  const latestArticles = useMemo(
    () => [...filteredArticles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [filteredArticles]
  );
  const topArticles = useMemo(
    () => [...filteredArticles].sort((a, b) => b.likes - a.likes),
    [filteredArticles]
  );
  const trendingArticles = useMemo(
    () => [...filteredArticles].sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0)),
    [filteredArticles]
  );

  const renderArticles = (articleList: Article[]) => {
    if (viewMode === 'grid') {
      return <ArticleGrid articles={articleList} variant="default" />;
    }
    return (
      <div className="space-y-0">
        {articleList.map((article) => (
          <ArticleListItem key={article.id} article={article} />
        ))}
      </div>
    );
  };

  // 是否有多种内容类型（只有单一类型时隐藏筛选器）
  const hasMultipleTypes = (counts.article > 0 ? 1 : 0) + (counts.podcast > 0 ? 1 : 0) + (counts.slides > 0 ? 1 : 0) > 1;

  return (
    <Tabs defaultValue="latest" className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
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

      <TabsContent value="latest" className="mt-0">
        {renderArticles(latestArticles)}
      </TabsContent>

      <TabsContent value="top" className="mt-0">
        {renderArticles(topArticles)}
      </TabsContent>

      <TabsContent value="trending" className="mt-0">
        {renderArticles(trendingArticles)}
      </TabsContent>
    </Tabs>
  );
}
