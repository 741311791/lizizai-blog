import PageHeaderV2 from '@/components/ui-v2/PageHeaderV2';
import CategoryArticlesSection from '@/components/article/CategoryArticlesSection';
import { getCategories, getArticlesByCategory, getAllCategorySlugs } from '@/lib/blog-data';
import { notFound } from 'next/navigation';
import { generateCategoryMetadata } from '@/lib/seo';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('category');

  // 并行获取，避免串行瀑布
  const [categories, articles] = await Promise.all([
    getCategories(),
    getArticlesByCategory(slug),
  ]);
  const category = categories.find(c => c.slug === slug);

  if (!category) {
    notFound();
  }

  const articleCount = articles.length;

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-12">
      {/* Category Header V2 */}
      <PageHeaderV2
        count={articleCount}
        countLabel={t('articles')}
        title={category.name}
        description={category.description}
      />

      {/* Articles Section */}
      {articles.length > 0 ? (
        <CategoryArticlesSection articles={articles} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {t('noArticles')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('checkBack')}
          </p>
        </div>
      )}
    </div>
  );
}

// 允许动态参数（新增分类）
export const dynamicParams = true;
