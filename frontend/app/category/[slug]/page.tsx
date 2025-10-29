import { Badge } from '@/components/ui/badge';
import ArticleCard from '@/components/article/ArticleCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Mock category data
const mockCategories: Record<string, any> = {
  'ai-prompts': {
    name: 'AI & Prompts',
    slug: 'ai-prompts',
    description: 'Explore the intersection of artificial intelligence and creative prompts. Learn how to leverage AI tools to enhance your productivity and creativity.',
    articleCount: 24,
  },
  'writing-strategies': {
    name: 'Writing Strategies',
    slug: 'writing-strategies',
    description: 'Master the art of writing with proven strategies and techniques. From content creation to storytelling, discover how to craft compelling narratives.',
    articleCount: 18,
  },
  'marketing-strategies': {
    name: 'Marketing Strategies',
    slug: 'marketing-strategies',
    description: 'Build and grow your personal brand with effective marketing strategies. Learn how to attract and engage your audience in the digital age.',
    articleCount: 32,
  },
  'human-3-0': {
    name: 'HUMAN 3.0',
    slug: 'human-3-0',
    description: 'The evolution of human potential in the age of AI. Discover how to thrive in a rapidly changing world by embracing your unique human capabilities.',
    articleCount: 15,
  },
  'featured': {
    name: 'Featured',
    slug: 'featured',
    description: 'Our most popular and impactful articles, handpicked for you.',
    articleCount: 12,
  },
  'lifestyle': {
    name: 'Lifestyle',
    slug: 'lifestyle',
    description: 'Design your ideal lifestyle with practical advice on productivity, health, and personal development.',
    articleCount: 28,
  },
};

// Mock articles for category
const mockArticles = [
  {
    id: '1',
    title: 'You have about 36 months to make it',
    subtitle: 'why everyone is racing to get rich',
    slug: 'you-have-36-months-to-make-it',
    featuredImage: 'https://picsum.photos/seed/cat1/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
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
    featuredImage: 'https://picsum.photos/seed/cat2/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-10-15',
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
    featuredImage: 'https://picsum.photos/seed/cat3/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-07-25',
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
    featuredImage: 'https://picsum.photos/seed/cat4/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-08-25',
    likes: 1173,
    commentsCount: 80,
    category: {
      name: 'HUMAN 3.0',
      slug: 'human-3-0',
    },
  },
  {
    id: '5',
    title: 'How to become so focused it feels illegal',
    subtitle: 'On deep work and brain altering technology',
    slug: 'become-focused-feels-illegal',
    featuredImage: 'https://picsum.photos/seed/cat5/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-10-09',
    likes: 1321,
    commentsCount: 51,
    category: {
      name: 'Productivity',
      slug: 'productivity',
    },
  },
  {
    id: '6',
    title: 'Yes, the matrix is real, here\'s how to escape it',
    subtitle: 'it\'s not what you think',
    slug: 'matrix-real-how-to-escape',
    featuredImage: 'https://picsum.photos/seed/cat6/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-10-02',
    likes: 511,
    commentsCount: 47,
    category: {
      name: 'Philosophy',
      slug: 'philosophy',
    },
  },
];

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = mockCategories[params.slug] || mockCategories['featured'];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      {/* Category Header */}
      <header className="mb-12 text-center space-y-4">
        <Badge variant="secondary" className="mb-4">
          {category.articleCount} Articles
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          {category.name}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {category.description}
        </p>
      </header>

      {/* Tabs for sorting */}
      <Tabs defaultValue="latest" className="mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="latest" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="top" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...mockArticles]
              .sort((a, b) => b.likes - a.likes)
              .map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...mockArticles]
              .sort((a, b) => b.commentsCount - a.commentsCount)
              .map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Load More Button */}
      <div className="mt-12 text-center">
        <button className="px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors">
          Load More Articles
        </button>
      </div>
    </div>
  );
}
