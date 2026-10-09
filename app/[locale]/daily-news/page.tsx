/**
 * Daily News 分类页面
 *
 * 路由：/[locale]/daily-news
 * 复用分类页布局，与 /category/ai 等页面保持一致。
 * 数据源：R2 articles.json，通过 getArticlesByCategory('daily-news') 获取。
 */

import CategoryArticlesSection from '@/components/article/CategoryArticlesSection';
import PageHeaderV2 from '@/components/ui-v2/PageHeaderV2';
import { getCategories, getArticlesByCategory } from '@/lib/blog-data';
import { generateCategoryMetadata } from '@/lib/seo';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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

export default async function DailyNewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('category');

  // 并行获取，避免串行瀑布
  const [categories, articles] = await Promise.all([
    getCategories(),
    getArticlesByCategory(CATEGORY_SLUG),
  ]);
  const category = categories.find(c => c.slug === CATEGORY_SLUG);

  const categoryName = category?.name || 'Daily News';
  const categoryDesc = category?.description || '';
  const articleCount = articles.length;

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-12">
      {/* 分类头部（与其他导航页共用 PageHeaderV2，pulse 走线变体） */}
      <PageHeaderV2
        variant="pulse"
        count={articleCount}
        countLabel={t('articles')}
        title={categoryName}
        description={categoryDesc || undefined}
      />

      {/* 文章列表 */}
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
