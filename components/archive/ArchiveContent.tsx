'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Calendar, Heart, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ArchiveContentProps {
  archiveData: Record<string, Record<string, any[]>>;
}

export default function ArchiveContent({ archiveData }: ArchiveContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter articles based on search query
  const filterArticles = (articles: any[]) => {
    if (!searchQuery) return articles;
    return articles.filter((article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <>
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
        {Object.entries(archiveData).map(([year, months]) => (
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
                                      {format(
                                        new Date(article.publishedAt),
                                        'MMM dd'
                                      )}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />
                                      {article.likes || 0}
                                    </span>
                                    {article.commentsCount !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <MessageCircle className="h-3 w-3" />
                                        {article.commentsCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {article.category && (
                                  <Badge variant="secondary" className="shrink-0">
                                    {typeof article.category === 'string'
                                      ? article.category
                                      : article.category.name}
                                  </Badge>
                                )}
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
      {searchQuery &&
        Object.values(archiveData).every((months) =>
          Object.values(months).every(
            (articles) => filterArticles(articles).length === 0
          )
        ) && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No articles found matching "{searchQuery}"
            </p>
          </div>
        )}
    </>
  );
}
