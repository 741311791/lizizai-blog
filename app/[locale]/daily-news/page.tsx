/**
 * Daily News 分类页面
 *
 * 路由：/[locale]/daily-news
 * 复用分类页布局，与 /category/ai 等页面保持一致。
 * 数据源：R2 articles.json，通过 getArticlesByCategory('daily-news') 获取。
 */

import { Badge } from '@/components/ui/badge';
import CategoryArticlesSection from '@/components/article/CategoryArticlesSection';
import { getCategories, getArticlesByCategory } from '@/lib/blog-data';
import { generateCategoryMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const revalidate = 3600;

const CATEGORY_SLUG = 'daily-news';

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getCategories();
  const category = categories.find(c => c.slug === CATEGORY_SLUG);

  if (!category) {
    return {
      title: 'Daily News',
      description: '每日 AI 行业资讯精选',
    };
  }

  return generateCategoryMetadata({
    name: category.name,
    description: category.description || '',
    slug: CATEGORY_SLUG,
  });
}

export default async function DailyNewsPage() {
  const categories = await getCategories();
  const category = categories.find(c => c.slug === CATEGORY_SLUG);
  const articles = await getArticlesByCategory(CATEGORY_SLUG);

  const categoryName = category?.name || 'Daily News';
  const categoryDesc = category?.description || '';
  const articleCount = articles.length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* 分类头部 */}
      <header className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="secondary">{articleCount} Articles</Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          {categoryName}
        </h1>
        {categoryDesc && (
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {categoryDesc}
          </p>
        )}
      </header>

      {/* 文章列表 */}
      {articles.length > 0 ? (
        <CategoryArticlesSection articles={articles} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No articles found yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Check back soon for new content!
          </p>
        </div>
      )}
    </div>
  );
}
