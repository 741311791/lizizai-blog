'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageCircle, Heart, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

// Mock discussion data
const mockDiscussions = [
  {
    id: '1',
    title: 'What\'s your take on AI replacing creative work?',
    excerpt: 'I\'ve been thinking a lot about the article on taste being the new intelligence. Do you think AI will truly replace creative professionals, or will it just change how we work?',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://picsum.photos/seed/disc1/100/100',
    },
    createdAt: '2025-10-28',
    repliesCount: 24,
    likes: 156,
    category: 'AI & Prompts',
    isHot: true,
  },
  {
    id: '2',
    title: 'Best productivity tools for one-person businesses?',
    excerpt: 'I\'m building my one-person business and looking for recommendations on tools that actually make a difference. What\'s your stack?',
    author: {
      name: 'Mike Chen',
      avatar: 'https://picsum.photos/seed/disc2/100/100',
    },
    createdAt: '2025-10-27',
    repliesCount: 42,
    likes: 203,
    category: 'Productivity',
    isHot: true,
  },
  {
    id: '3',
    title: 'How do you stay focused in the age of distraction?',
    excerpt: 'The dopamine detox article really resonated with me. I\'m curious about everyone\'s strategies for maintaining deep focus.',
    author: {
      name: 'Emma Davis',
      avatar: 'https://picsum.photos/seed/disc3/100/100',
    },
    createdAt: '2025-10-26',
    repliesCount: 31,
    likes: 178,
    category: 'Lifestyle',
    isHot: false,
  },
  {
    id: '4',
    title: 'Anyone else doing the 30-day reset challenge?',
    excerpt: 'Starting the 30-day life reset tomorrow. Would love to connect with others doing the same and share progress!',
    author: {
      name: 'Alex Turner',
      avatar: 'https://picsum.photos/seed/disc4/100/100',
    },
    createdAt: '2025-10-25',
    repliesCount: 67,
    likes: 289,
    category: 'Challenges',
    isHot: true,
  },
  {
    id: '5',
    title: 'Thoughts on the HUMAN 3.0 framework?',
    excerpt: 'Just read the HUMAN 3.0 article. The framework is interesting but I\'m struggling to apply it. Anyone have practical examples?',
    author: {
      name: 'Jordan Lee',
      avatar: 'https://picsum.photos/seed/disc5/100/100',
    },
    createdAt: '2025-10-24',
    repliesCount: 19,
    likes: 94,
    category: 'HUMAN 3.0',
    isHot: false,
  },
];

function DiscussionCard({ discussion }: { discussion: any }) {
  const initials = discussion.author.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Link
      href={`/discussion/${discussion.id}`}
      className="block p-6 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                {discussion.title}
              </h3>
              {discussion.isHot && (
                <Badge variant="destructive" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Hot
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {discussion.excerpt}
            </p>
          </div>
          <Badge variant="secondary">{discussion.category}</Badge>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={discussion.author.avatar} alt={discussion.author.name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">{discussion.author.name}</div>
              <div className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(discussion.createdAt), 'MMM dd')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {discussion.repliesCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {discussion.likes}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ChatPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      {/* Header */}
      <header className="mb-12 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Community Discussions
        </h1>
        <p className="text-xl text-muted-foreground">
          Join the conversation and connect with fellow readers
        </p>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="hot" className="mb-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="hot">Hot</TabsTrigger>
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="top">Top</TabsTrigger>
        </TabsList>

        <TabsContent value="hot" className="mt-8 space-y-4">
          {mockDiscussions
            .filter((d) => d.isHot)
            .map((discussion) => (
              <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}
        </TabsContent>

        <TabsContent value="latest" className="mt-8 space-y-4">
          {mockDiscussions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((discussion) => (
              <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}
        </TabsContent>

        <TabsContent value="top" className="mt-8 space-y-4">
          {mockDiscussions
            .sort((a, b) => b.likes - a.likes)
            .map((discussion) => (
              <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}
        </TabsContent>
      </Tabs>

      {/* Start Discussion CTA */}
      <div className="mt-12 text-center p-8 rounded-lg bg-muted/50 border border-border">
        <h3 className="text-2xl font-bold mb-3">Have a question or idea?</h3>
        <p className="text-muted-foreground mb-6">
          Start a new discussion and get insights from the community
        </p>
        <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold">
          Start a Discussion
        </button>
      </div>
    </div>
  );
}
