'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ArticleGrid from '@/components/article/ArticleGrid';
import ArticleListItem from '@/components/article/ArticleListItem';
import LayoutToggle from '@/components/article/LayoutToggle';
import { useViewMode } from '@/hooks/useViewMode';
import type { Article } from '@/types/index';

interface CategoryArticlesSectionProps {
  articles: Article[];
}

export default function CategoryArticlesSection({
  articles,
}: CategoryArticlesSectionProps) {
  const [viewMode, setViewMode] = useViewMode('list');

  // 按不同方式排序文章
  const latestArticles = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const topArticles = [...articles].sort((a, b) => b.likes - a.likes);
  const trendingArticles = [...articles].sort(
    (a, b) => (b.commentsCount || 0) - (a.commentsCount || 0)
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

  return (
    <Tabs defaultValue="latest" className="mb-8">
      <div className="flex items-center justify-between mb-8">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
        <div className="hidden sm:block">
          <LayoutToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

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
