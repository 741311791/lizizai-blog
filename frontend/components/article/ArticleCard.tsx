'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Share2, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
    likes: initialLikes,
    sharesCount = 0,
    category,
  } = article;

  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [shares, setShares] = useState(sharesCount);
  const [imageError, setImageError] = useState(false);

  // 获取图片 URL（如果没有封面图，使用占位图）
  const imageUrl = getArticleImageUrl(featuredImage, id);
  
  useEffect(() => {
    // Check if user has liked this article
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
      
      // Update localStorage
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
    <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all h-full flex flex-col">
      <Link href={`/article/${slug}`} className="flex flex-col h-full">
        {/* 文章封面图片区域 - 始终显示 */}
        <div className="relative aspect-video overflow-hidden bg-muted">
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
            // 图片加载失败时的占位 UI
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
              <ImageOff className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm font-medium">图片无法加载</p>
              <p className="text-xs opacity-70 mt-1">Image failed to load</p>
            </div>
          )}
        </div>
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
                className={`h-8 gap-1.5 text-xs ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likes}</span>
              </Button>
              <ShareMenu
                title={title}
                description={subtitle}
                url={`${config.siteUrl}/article/${slug}`}
                onShare={() => {
                  // 增加分享计数
                  setShares(prev => prev + 1);
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{shares}</span>
                </Button>
              </ShareMenu>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
