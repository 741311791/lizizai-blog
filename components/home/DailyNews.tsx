/**
 * 首页「Daily News」模块
 *
 * Server Component，从 R2 Article 数据中获取 daily-news 分类的文章。
 * 使用 ArticleGrid 渲染，与 PopularArticles 风格一致。
 */

import { getArticlesByCategory } from '@/lib/blog-data';
import ArticleGrid from '@/components/article/ArticleGrid';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export default async function DailyNews() {
  const t = await getTranslations('aiNews');
  const articles = await getArticlesByCategory('daily-news');

  // 无文章时整体隐藏
  if (articles.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">
          {t('dailyTitle')}
        </h2>
        <Link href="/daily-news">
          <Button variant="link" className="text-primary hover:text-primary/80 text-sm">
            {t('viewAll')} →
          </Button>
        </Link>
      </div>

      <ArticleGrid articles={articles.slice(0, 6)} variant="default" />
    </section>
  );
}
