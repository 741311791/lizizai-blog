import Hero from '@/components/home/Hero';
import PopularArticles from '@/components/home/PopularArticles';
import AboutMe from '@/components/home/AboutMe';
import ArticlesSection from '@/components/article/ArticlesSection';
import DailyNews from '@/components/home/DailyNews';
import { getAllArticles } from '@/lib/blog-data';
import { getTranslations } from 'next-intl/server';

export const revalidate = 3600; // ISR: 每小时重新验证

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('home');
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
      <PopularArticles articles={allArticles} locale={locale} />

      {/* Stats Bar - 签名时刻 */}
      <section className="border-y border-border bg-card/50 py-8 -mx-4 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-primary">{allArticles.length}+</div>
            <div className="text-sm text-muted-foreground mt-1">{t('statsArticles')}</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-accent">AI</div>
            <div className="text-sm text-muted-foreground mt-1">{t('statsInsights')}</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-secondary">Free</div>
            <div className="text-sm text-muted-foreground mt-1">{t('statsFree')}</div>
          </div>
        </div>
      </section>

      {/* 每日 AI 资讯 */}
      <DailyNews locale={locale} />

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
