'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Calendar, Heart, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

// Mock archive data grouped by year and month
const mockArchive = {
  '2025': {
    'October': [
      {
        id: '1',
        title: 'The challenge starts tomorrow',
        slug: 'challenge-starts-tomorrow',
        publishedAt: '2025-10-27',
        likes: 79,
        commentsCount: 12,
        category: 'Featured',
      },
      {
        id: '2',
        title: 'How to not waste your 20s (this may sting)',
        slug: 'not-waste-20s',
        publishedAt: '2025-10-25',
        likes: 496,
        commentsCount: 44,
        category: 'Lifestyle',
      },
      {
        id: '3',
        title: 'Most of the work you\'re doing is unnecessary',
        slug: 'work-unnecessary',
        publishedAt: '2025-10-19',
        likes: 563,
        commentsCount: 37,
        category: 'Productivity',
      },
      {
        id: '4',
        title: 'A dopamine detox to reset your life in 30 days',
        slug: 'dopamine-detox-reset-life-30-days',
        publishedAt: '2025-10-16',
        likes: 2052,
        commentsCount: 69,
        category: 'Lifestyle',
      },
    ],
    'September': [
      {
        id: '5',
        title: 'You won\'t be the same person in 6 months',
        slug: 'not-same-person-6-months',
        publishedAt: '2025-09-23',
        likes: 748,
        commentsCount: 39,
        category: 'Personal Growth',
      },
    ],
    'August': [
      {
        id: '6',
        title: 'HUMAN 3.0 – A Map To Reach The Top 1%',
        slug: 'human-3-0-map-top-1-percent',
        publishedAt: '2025-08-26',
        likes: 1174,
        commentsCount: 80,
        category: 'HUMAN 3.0',
      },
    ],
    'July': [
      {
        id: '7',
        title: 'A Prompt To Reset Your Life In 30 Days',
        slug: 'prompt-reset-life-30-days',
        publishedAt: '2025-07-26',
        likes: 418,
        commentsCount: 20,
        category: 'AI & Prompts',
      },
      {
        id: '8',
        title: 'You have about 36 months to make it',
        slug: 'you-have-36-months-to-make-it',
        publishedAt: '2025-07-21',
        likes: 1844,
        commentsCount: 146,
        category: 'Featured',
      },
    ],
  },
};

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter articles based on search query
  const filterArticles = (articles: any[]) => {
    if (!searchQuery) return articles;
    return articles.filter((article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <header className="mb-12 text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Archive
        </h1>
        <p className="text-xl text-muted-foreground">
          Browse all articles by date
        </p>
      </header>

      {/* Search Bar */}
      <div className="mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>

      {/* Archive Timeline */}
      <div className="space-y-12">
        {Object.entries(mockArchive).map(([year, months]) => (
          <div key={year}>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              {year}
            </h2>
            
            <div className="space-y-8">
              {Object.entries(months).map(([month, articles]) => {
                const filteredArticles = filterArticles(articles);
                if (filteredArticles.length === 0) return null;

                return (
                  <div key={month}>
                    <h3 className="text-xl font-semibold mb-4 text-primary">
                      {month}
                    </h3>
                    <div className="space-y-4 pl-6 border-l-2 border-border">
                      {filteredArticles.map((article) => (
                        <div key={article.id} className="pl-6 -ml-px">
                          <Link
                            href={`/article/${article.slug}`}
                            className="block group"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold group-hover:text-primary transition-colors">
                                    {article.title}
                                  </h4>
                                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      {format(new Date(article.publishedAt), 'MMM dd')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />
                                      {article.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" />
                                      {article.commentsCount}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="shrink-0">
                                  {article.category}
                                </Badge>
                              </div>
                            </div>
                          </Link>
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {searchQuery && Object.values(mockArchive).every((months) =>
        Object.values(months).every((articles) => filterArticles(articles).length === 0)
      ) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No articles found matching "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
