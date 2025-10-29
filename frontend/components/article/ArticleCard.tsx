'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  featuredImage?: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  likes: number;
  commentsCount?: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const {
    id,
    title,
    subtitle,
    slug,
    featuredImage,
    author,
    publishedAt,
    likes,
    commentsCount = 0,
    category,
  } = article;
  
  return (
    <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all h-full flex flex-col">
      <Link href={`/article/${slug}`} className="flex flex-col h-full">
        {featuredImage && (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={featuredImage}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <CardContent className="p-5 flex flex-col flex-1">
          {category && (
            <div className="mb-2 text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {category.name}
            </div>
          )}
          <h3 className="mb-2 text-lg font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[3.5rem]">
            {title}
          </h3>
          {subtitle && (
            <p className="mb-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="mt-auto pt-4 border-t border-border">
            {/* Default state: Author and Date */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:mb-3 transition-all">
              <span className="font-medium truncate">{author.name}</span>
              <span className="shrink-0">•</span>
              <span className="shrink-0">
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            
            {/* Hover state: Action buttons */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity max-h-0 group-hover:max-h-10 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Implement like functionality
                }}
              >
                <Heart className="h-3.5 w-3.5" />
                <span>{likes}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Implement comment functionality
                }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{commentsCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Implement share functionality
                }}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
