import Hero from '@/components/home/Hero';
import ArticleCard from '@/components/article/ArticleCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

// Mock data for demonstration
const mockArticles = [
  {
    id: '1',
    title: 'You have about 36 months to make it',
    subtitle: 'why everyone is racing to get rich',
    slug: 'you-have-36-months-to-make-it',
    featuredImage: 'https://picsum.photos/seed/article1/800/600',
    author: {
      name: 'DAN KOE',
      avatar: '',
    },
    publishedAt: '2025-07-21',
    likes: 1844,
    commentsCount: 146,
    category: {
      name: 'Featured',
      slug: 'featured',
    },
  },
  {
    id: '2',
    title: 'A dopamine detox to reset your life in 30 days',
    subtitle: 'Because most of modern life has become a blur',
    slug: 'dopamine-detox-reset-life-30-days',
    featuredImage: 'https://picsum.photos/seed/article2/800/600',
    author: {
      name: 'DAN KOE',
      avatar: '',
    },
    publishedAt: '2025-10-16',
    likes: 2051,
    commentsCount: 69,
    category: {
      name: 'Lifestyle',
      slug: 'lifestyle',
    },
  },
  {
    id: '3',
    title: 'A Prompt To Reset Your Life In 30 Days',
    subtitle: 'Use AI to design your ideal life',
    slug: 'prompt-reset-life-30-days',
    featuredImage: 'https://picsum.photos/seed/article3/800/600',
    author: {
      name: 'DAN KOE',
      avatar: '',
    },
    publishedAt: '2025-07-26',
    likes: 418,
    commentsCount: 20,
    category: {
      name: 'AI & Prompts',
      slug: 'ai-prompts',
    },
  },
  {
    id: '4',
    title: 'HUMAN 3.0 – A Map To Reach The Top 1%',
    subtitle: 'The evolution of human potential',
    slug: 'human-3-0-map-top-1-percent',
    featuredImage: 'https://picsum.photos/seed/article4/800/600',
    author: {
      name: 'DAN KOE',
      avatar: '',
    },
    publishedAt: '2025-08-26',
    likes: 1173,
    commentsCount: 80,
    category: {
      name: 'HUMAN 3.0',
      slug: 'human-3-0',
    },
  },
];

export default function Home() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <Hero />

      {/* Most Popular Section */}
      <section className="py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Most Popular</h2>
          <Button variant="link" className="text-primary">
            VIEW ALL
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mockArticles.map((article) => (
            <ArticleCard key={article.id} {...article} />
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
              {mockArticles.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="top">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mockArticles.slice().reverse().map((article) => (
                <ArticleCard key={article.id} {...article} />
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
