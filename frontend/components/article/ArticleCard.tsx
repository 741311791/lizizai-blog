'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ArticleCardProps {
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

export default function ArticleCard({
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
}: ArticleCardProps) {
  return (
    <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all">
      <Link href={`/article/${slug}`}>
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
        <CardContent className="p-6">
          {category && (
            <div className="mb-2 text-xs text-muted-foreground uppercase tracking-wide">
              {category.name}
            </div>
          )}
          <h3 className="mb-2 text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {subtitle && (
            <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
              {subtitle}
            </p>
          )}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{author.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                <span>{commentsCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
