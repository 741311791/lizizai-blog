import Image from 'next/image';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for demonstration
const mockArticle = {
  id: '1',
  title: 'You have about 36 months to make it',
  subtitle: 'why everyone is racing to get rich',
  content: `
    <p>I've been seeing this statement circulate online: "You have about 36 months to make it."</p>
    
    <p>And it makes sense: AI will continue to replace jobs no matter how much people fight against it. Money as we know it will change or even cease to exist because millions of ASIs (artificial superintelligences) will rapidly execute tasks beyond human comprehension, dictating humanity's future.</p>
    
    <h2>Doers vs directors</h2>
    
    <p>This creates a clear distinction between those who will thrive and those who won't.</p>
    
    <p>Doers vs directors. Employees vs entrepreneurs. Low-agency vs high-agency. Those who assign work rather than having work assigned to them.</p>
  `,
  featuredImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop',
  author: {
    name: 'DAN KOE',
    avatar: '',
  },
  publishedAt: '2025-07-21',
  likes: 1844,
  commentsCount: 146,
  views: 326,
};

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return (
    <article className="container max-w-4xl py-12">
      {/* Article Header */}
      <header className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          {mockArticle.title}
        </h1>
        <p className="text-xl text-muted-foreground">
          {mockArticle.subtitle}
        </p>
        
        {/* Author and Meta Info */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-semibold">DK</span>
            </div>
            <div>
              <p className="font-semibold">{mockArticle.author.name}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(mockArticle.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          
          {/* Interaction Stats */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <Heart className="h-5 w-5" />
              <span>{mockArticle.likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              <span>{mockArticle.commentsCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="h-5 w-5" />
              <span>{mockArticle.views}</span>
            </Button>
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {mockArticle.featuredImage && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
          <Image
            src={mockArticle.featuredImage}
            alt={mockArticle.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Article Content */}
      <div 
        className="prose prose-invert prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: mockArticle.content }}
      />

      {/* Comments Section */}
      <section className="mt-12 border-t border-border pt-8">
        <h2 className="mb-6 text-2xl font-bold">
          Comments ({mockArticle.commentsCount})
        </h2>
        <div className="space-y-6">
          <p className="text-center text-muted-foreground py-8">
            Comments section coming soon...
          </p>
        </div>
      </section>
    </article>
  );
}
