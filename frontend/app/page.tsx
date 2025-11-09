import Hero from '@/components/home/Hero';
import PopularArticles from '@/components/home/PopularArticles';
import AboutMe from '@/components/home/AboutMe';
import ArticlesSection from '@/components/article/ArticlesSection';
import { getArticles } from '@/lib/strapi';
import { transformArticles } from '@/lib/transformers';

export default async function Home() {
  // Fetch latest articles (sorted by publishedAt)
  const latestResponse = await getArticles({
    pageSize: 9,
    sort: 'publishedAt:desc',
  });
  const latestArticles = transformArticles(latestResponse.data as any);

  // Fetch top articles (sorted by views)
  const topResponse = await getArticles({
    pageSize: 9,
    sort: 'views:desc',
  });
  const topArticles = transformArticles(topResponse.data as any);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-12">
      {/* Hero Section */}
      <Hero />

      {/* Most Popular Section */}
      <PopularArticles />

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

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds
