import { Badge } from '@/components/ui/badge';
import CategoryArticlesSection from '@/components/article/CategoryArticlesSection';
import { getCategories, getArticlesByCategory, getAllCategorySlugs } from '@/lib/blog-data';
import { notFound } from 'next/navigation';
import { generateCategoryMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const revalidate = 3600; // ISR: 每小时重新验证

// 生成静态路径
export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map(slug => ({ slug }));
}

// 生成 SEO 元数据
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find(c => c.slug === slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  return generateCategoryMetadata({
    name: category.name,
    description: category.description || '',
    slug: category.slug,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const categories = await getCategories();
  const category = categories.find(c => c.slug === slug);

  if (!category) {
    notFound();
  }

  const articles = await getArticlesByCategory(slug);
  const articleCount = articles.length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Category Header */}
      <header className="mb-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="secondary">{articleCount} Articles</Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          {category.name}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {category.description}
        </p>
      </header>

      {/* Articles Section */}
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
    </div>
  );
}

// 允许动态参数（新增分类）
export const dynamicParams = true;
