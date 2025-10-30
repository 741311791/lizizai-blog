import Hero from '@/components/home/Hero';
import ArticleCard from '@/components/article/ArticleCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { getArticles } from '@/lib/strapi';
import { transformArticles } from '@/lib/transformers';
import Link from 'next/link';

export default async function Home() {
  // Fetch popular articles (sorted by likes)
  const popularResponse = await getArticles({
    pageSize: 4,
    sort: 'likes:desc',
  });
  const popularArticles = transformArticles(popularResponse.data as any);

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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <Hero />

      {/* Most Popular Section */}
      <section className="py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Most Popular</h2>
          <Link href="/archive">
            <Button variant="link" className="text-primary">
              VIEW ALL
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* Latest Articles Section */}
      <section className="py-12">
        <Tabs defaultValue="latest" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="top">Top</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
          </TabsList>
          <TabsContent value="latest">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="top">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="discussions" className="space-y-6">
            <p className="text-center text-muted-foreground py-12">
              No discussions yet. Be the first to start one!
            </p>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 60; // Revalidate every 60 seconds
