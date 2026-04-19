'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import ArticleGrid from '@/components/article/ArticleGrid';
import ArticleListItem from '@/components/article/ArticleListItem';
import LayoutToggle from '@/components/article/LayoutToggle';
import { useViewMode } from '@/hooks/useViewMode';
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
  const [viewMode, setViewMode] = useViewMode('list');

  return (
    <section className="py-12">
      <Tabs defaultValue="latest" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="latest">{t('latest')}</TabsTrigger>
            <TabsTrigger value="top">{t('top')}</TabsTrigger>
          </TabsList>
          <div className="hidden sm:block">
            <LayoutToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
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
      </Tabs>
    </section>
  );
}
