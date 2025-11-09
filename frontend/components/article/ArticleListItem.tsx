'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Share2, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { likeArticle } from '@/lib/api';
import { getVisitorId } from '@/lib/visitor';
import { config } from '@/lib/env';
import { getArticleImageUrl } from '@/lib/utils/image';
import ShareMenu from '@/components/share/ShareMenu';

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
  sharesCount?: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface ArticleListItemProps {
  article: Article;
}

export default function ArticleListItem({ article }: ArticleListItemProps) {
  const {
    id,
    title,
    subtitle,
    slug,
    featuredImage,
    author,
    publishedAt,
    likes: initialLikes,
    sharesCount = 0,
  } = article;

  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [shares, setShares] = useState(sharesCount);
  const [imageError, setImageError] = useState(false);

  const imageUrl = getArticleImageUrl(featuredImage, id);

  useEffect(() => {
    const likedArticles = JSON.parse(
      localStorage.getItem('likedArticles') || '{}'
    );
    setIsLiked(!!likedArticles[id]);
  }, [id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;

    const visitorId = getVisitorId();
    if (!visitorId) {
      console.error('Failed to get visitor ID');
      return;
    }

    setIsLiking(true);
    try {
      const result = await likeArticle(Number(id), visitorId);

      setLikes(result.likes);
      setIsLiked(result.liked);

      const likedArticles = JSON.parse(
        localStorage.getItem('likedArticles') || '{}'
      );
      if (result.liked) {
        likedArticles[id] = true;
      } else {
        delete likedArticles[id];
      }
      localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
    } catch (error) {
      console.error('Failed to like article:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Link href={`/article/${slug}`}>
      <article className="group flex gap-6 py-6 border-b border-border hover:bg-accent/50 transition-colors -mx-4 px-4">
        {/* 左侧内容 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="flex items-center gap-4">
            {/* 作者和日期 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{author.name}</span>
              <span>•</span>
              <span>
                {new Date(publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {/* 操作按钮 */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1.5 text-xs ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likes}</span>
              </Button>
              <ShareMenu
                title={title}
                description={subtitle}
                url={`${config.siteUrl}/article/${slug}`}
                onShare={() => setShares(prev => prev + 1)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Share2 className="h-3 w-3" />
                  <span>{shares}</span>
                </Button>
              </ShareMenu>
            </div>
          </div>
        </div>

        {/* 右侧图片 */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized={imageUrl.includes('picsum.photos')}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
              <ImageOff className="h-8 w-8 opacity-50" />
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
