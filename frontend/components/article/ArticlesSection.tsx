'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ArticleGrid from '@/components/article/ArticleGrid';
import ArticleListItem from '@/components/article/ArticleListItem';
import LayoutToggle from '@/components/article/LayoutToggle';
import { useViewMode } from '@/hooks/useViewMode';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  featuredImage?: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  likes: number;
  sharesCount?: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface ArticlesSectionProps {
  latestArticles: Article[];
  topArticles: Article[];
}

export default function ArticlesSection({
  latestArticles,
  topArticles,
}: ArticlesSectionProps) {
  const [viewMode, setViewMode] = useViewMode('list');

  return (
    <section className="py-12">
      <Tabs defaultValue="latest" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="top">Top</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
          </TabsList>
          <LayoutToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        <TabsContent value="latest">
          {viewMode === 'grid' ? (
            <ArticleGrid articles={latestArticles} variant="default" />
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
            <ArticleGrid articles={topArticles} variant="default" />
          ) : (
            <div className="space-y-0">
              {topArticles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discussions" className="space-y-6">
          <p className="text-center text-muted-foreground py-12">
            No discussions yet. Be the first to start one!
          </p>
        </TabsContent>
      </Tabs>
    </section>
  );
}
