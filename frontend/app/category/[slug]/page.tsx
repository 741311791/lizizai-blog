import { Badge } from '@/components/ui/badge';
import CategoryArticlesSection from '@/components/article/CategoryArticlesSection';
import { getCategoryBySlug, getArticlesByCategory } from '@/lib/strapi';
import { transformArticles } from '@/lib/transformers';
import {
  mockCategories,
  getMockArticlesByCategory,
  getDefaultCategory,
  getCategoryArticleCount,
} from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import { generateCategoryMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const strapiCategory = await getCategoryBySlug(slug);

    if (strapiCategory) {
      return generateCategoryMetadata({
        name: strapiCategory.name,
        description: strapiCategory.description,
        slug: strapiCategory.slug,
      });
    }
  } catch (error) {
    // Fallback to mock data
    const category = mockCategories[slug] || getDefaultCategory();
    return generateCategoryMetadata({
      name: category.name,
      description: category.description,
      slug,
    });
  }

  return {
    title: 'Category Not Found',
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let category: any = null;
  let articles: any[] = [];
  let isUsingMockData = false;

  try {
    // 优先尝试从 Strapi API 获取数据
    console.log(`🔍 Fetching category: ${slug} from Strapi API...`);

    const strapiCategory = await getCategoryBySlug(slug);

    if (strapiCategory) {
      category = strapiCategory;

      // 获取该分类下的文章
      const articlesResponse = await getArticlesByCategory(slug, 1, 50);
      articles = transformArticles(articlesResponse.data as any);

      console.log(`✅ Successfully loaded ${articles.length} articles from API`);
    } else {
      // API 返回空，尝试使用 Mock 数据
      console.log(`⚠️ Category not found in API, using mock data...`);
      throw new Error('Category not found in API');
    }
  } catch (error) {
    // API 调用失败，降级到 Mock 数据
    console.warn(
      `⚠️ Failed to fetch category from API, falling back to mock data:`,
      error
    );

    isUsingMockData = true;

    // 使用 Mock 数据
    category = mockCategories[slug] || getDefaultCategory();
    articles = getMockArticlesByCategory(slug);

    console.log(`📦 Using mock data: ${articles.length} articles`);
  }

  // 如果连 Mock 数据都没有，返回 404
  if (!category) {
    notFound();
  }

  // 计算文章数量
  const articleCount = articles.length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Category Header */}
      <header className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="secondary">{articleCount} Articles</Badge>
          {isUsingMockData && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Demo Data
            </Badge>
          )}
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          {category.name}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {category.description}
        </p>
      </header>

      {/* Articles Section with Layout Toggle */}
      {articles.length > 0 ? (
        <CategoryArticlesSection articles={articles} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No articles found in this category yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Check back soon for new content!
          </p>
        </div>
      )}

      {/* Load More Button (仅在有更多文章时显示) */}
      {articles.length >= 12 && (
        <div className="mt-12 text-center">
          <button className="px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors">
            Load More Articles
          </button>
        </div>
      )}
    </div>
  );
}

// 启用动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 60; // 每 60 秒重新验证
