import Hero from '@/components/home/Hero';
import PopularArticles from '@/components/home/PopularArticles';
import AboutMe from '@/components/home/AboutMe';
import ArticlesSection from '@/components/article/ArticlesSection';
import { getAllArticles } from '@/lib/blog-data';

export const revalidate = 3600; // ISR: 每小时重新验证

export default async function Home() {
  const allArticles = await getAllArticles();

  // 最新文章（已按日期降序排列）
  const latestArticles = allArticles.slice(0, 9);

  // 热门文章（按日期排序，后续可按 Webviso 浏览量排序）
  const topArticles = allArticles.slice(0, 9);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-12">
      {/* Hero Section */}
      <Hero />

      {/* Most Popular Section */}
      <PopularArticles articles={allArticles} />

      {/* Articles Section with Layout Toggle */}
      <ArticlesSection
        latestArticles={latestArticles}
        topArticles={topArticles}
      />

      {/* About Me Section */}
      <AboutMe />
    </div>
  );
}
