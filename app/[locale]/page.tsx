import Hero from '@/components/home/Hero';
import AboutMe from '@/components/home/AboutMe';
import ArticlesSection from '@/components/article/ArticlesSection';
import DailyNews from '@/components/home/DailyNews';
import { getAllArticles } from '@/lib/blog-data';

export const revalidate = 3600; // ISR: 每小时重新验证

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const allArticles = await getAllArticles();

  // 最新文章（已按日期降序排列）
  const latestArticles = allArticles.slice(0, 9);

  // 热门文章（按日期排序，后续可按 Webviso 浏览量排序）
  const topArticles = allArticles.slice(0, 9);

  // Hero 精选文章：取第一篇
  const featuredArticle = allArticles[0];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Hero 编辑精选 */}
      {featuredArticle && (
        <Hero article={featuredArticle} locale={locale} />
      )}

      {/* 每日资讯 — 水平滚动卡片 */}
      <DailyNews />

      {/* 文章区块 — 精选大卡 + 最新/热门 */}
      <ArticlesSection
        latestArticles={latestArticles}
        topArticles={topArticles}
      />

      {/* 关于我 — 维持现有布局 */}
      <AboutMe />
    </div>
  );
}
