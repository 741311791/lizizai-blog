import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AuthorCard from '@/components/article/AuthorCard';
import ArticleActions from '@/components/article/ArticleActions';
import ArticleContent from '@/components/article/ArticleContent';
import CommentSection from '@/components/article/CommentSection';
import RelatedArticles from '@/components/article/RelatedArticles';
import TableOfContents from '@/components/article/TableOfContents';

// Mock data for demonstration
const mockArticle = {
  id: '1',
  title: 'You have about 36 months to make it',
  subtitle: 'why everyone is racing to get rich',
  content: `
I've been seeing this statement circulate online:

_"You have about 36 months to make it."_

And it makes sense: AI will continue to replace jobs no matter how much people fight against it. Money as we know it will change or even cease to exist because millions of ASIs (artificial superintelligences) will rapidly execute tasks beyond human comprehension, dictating humanity's future.

My intention with this letter isn't to scare you or sound sensationalist. All of this is prediction and speculation. It can absolutely be wrong, and I expect most of it to be. I am simply setting the scene of the discussion happening in niche pockets of the internet.

## Doers vs directors

> We're going to see 10 person $1B companies pretty soon… In a group chat I have with my tech CEO friends, there's a betting pool for the first year that there will be a one-person $1B company.
> – Sam Altman

One thing is certain: The amount of power an individual has today is vastly more than any other moment in the past, and that will only continue to increase.

**The internet** gave people access to any and all knowledge. Power transferred away from schools and institutions.

**Social media** gave people the leverage to attract their own audience. Power transferred away from employers, publishers, centralized media, and even record labels.

**Artificial intelligence** is giving people the ability to create, automate, and outsource almost anything. Power is transferring away from traditional gatekeepers and intermediaries.

### The three superpowers

In short, you now have three superpowers to take control of your future:

- **Learning** – the ability to adapt and figure out what actions you must take to get a specific result.
- **Persuasion** – the ability to build trust and attract people to a mutually beneficial vision or narrative.
- **Execution** – the ability to turn ideas into reality through automation, creation, and delegation.

This creates a clear distinction between those who will thrive and those who won't.

## Taste is the new intelligence

The anti-AI crowd will lose. There will be an uproar of highly emotional people attempting to discredit those who attempt to leverage AI in their work, especially their creative work.

What these people don't yet understand is that the way we create is evolving just like before. Photography and video are extremely recent developments on the timescale of humanity.

**The single distinction that will separate art from slop is taste.**

In other words, nothing has changed. People just hate what's new, and that new is shining a light on what mattered in the first place.

## Utility vs meaning

Silicon solves utility so carbon can transcend to meaning. We hate long lines at the DMV. We hate when a server gets our order wrong. AI and automation solve necessary work that humans hate.

On the other hand, we crave the potential for failure. We love the final batter in the 9th inning. We travel across the world for a 5 star dining experience.

The future belongs to those who lean into their humanity.
  `,
  slug: 'you-have-36-months-to-make-it',
  featuredImage: 'https://picsum.photos/seed/article1/800/600',
  author: {
    name: 'DAN KOE',
    avatar: 'https://picsum.photos/seed/author/200/200',
  },
  publishedAt: '2025-07-20',
  likes: 1844,
  commentsCount: 146,
  shares: 326,
  category: {
    name: 'Featured',
    slug: 'featured',
  },
};

const mockComments = [
  {
    id: '1',
    author: {
      name: 'John Smith',
      avatar: 'https://picsum.photos/seed/user1/100/100',
    },
    content: 'This is such an insightful article! The point about taste being the new intelligence really resonated with me.',
    createdAt: '2025-07-22',
    likes: 42,
    replies: [
      {
        id: '2',
        author: {
          name: 'Sarah Johnson',
          avatar: 'https://picsum.photos/seed/user2/100/100',
        },
        content: 'Totally agree! The distinction between doers and directors is becoming more clear every day.',
        createdAt: '2025-07-23',
        likes: 15,
      },
    ],
  },
  {
    id: '3',
    author: {
      name: 'Mike Chen',
      avatar: 'https://picsum.photos/seed/user3/100/100',
    },
    content: 'Great perspective on AI and creativity. We need more nuanced discussions like this.',
    createdAt: '2025-07-24',
    likes: 28,
  },
];

const mockRelatedArticles = [
  {
    id: '2',
    title: 'A dopamine detox to reset your life in 30 days',
    subtitle: 'Because most of modern life has become a blur',
    slug: 'dopamine-detox-reset-life-30-days',
    featuredImage: 'https://picsum.photos/seed/related1/800/600',
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
    featuredImage: 'https://picsum.photos/seed/related2/800/600',
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
    featuredImage: 'https://picsum.photos/seed/related3/800/600',
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
];

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link 
          href={`/category/${mockArticle.category.slug}`} 
          className="hover:text-primary transition-colors"
        >
          {mockArticle.category.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px] sm:max-w-none">
          {mockArticle.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-12">
        {/* Main Content */}
        <article className="max-w-3xl">
          {/* Article Header */}
          <header className="mb-8 space-y-6">
            <Badge variant="secondary">{mockArticle.category.name}</Badge>
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              {mockArticle.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {mockArticle.subtitle}
            </p>
            
            <AuthorCard 
              author={mockArticle.author} 
              publishedAt={mockArticle.publishedAt} 
            />

            <ArticleActions
              likes={mockArticle.likes}
              commentsCount={mockArticle.commentsCount}
              shares={mockArticle.shares}
            />
          </header>

          {/* Featured Image */}
          {mockArticle.featuredImage && (
            <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
              <Image
                src={mockArticle.featuredImage}
                alt={mockArticle.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <ArticleContent content={mockArticle.content} />

          {/* Comments Section */}
          <div id="comments-section">
            <CommentSection 
              comments={mockComments} 
              commentsCount={mockArticle.commentsCount} 
            />
          </div>

          {/* Related Articles */}
          <RelatedArticles articles={mockRelatedArticles} />
        </article>

        {/* Sidebar - Table of Contents */}
        <aside className="hidden lg:block">
          <TableOfContents content={mockArticle.content} />
        </aside>
      </div>
    </div>
  );
}
