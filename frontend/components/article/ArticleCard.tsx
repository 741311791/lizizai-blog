'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-3">
                <span className="text-muted-foreground font-medium truncate">{author.name}</span>
                <span className="text-muted-foreground shrink-0">•</span>
                <span className="text-muted-foreground shrink-0">
                  {new Date(publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  <span className="font-medium">{likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">{commentsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
