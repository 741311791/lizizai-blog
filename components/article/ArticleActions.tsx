'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Share2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { postReaction, postVisit, isEmactionEnabled, isWebvisoEnabled } from '@/lib/services';

interface ArticleActionsProps {
  articleId: string;
  likes: number;
  shares: number;
  views?: number;
}

const LIKED_ARTICLES_KEY = 'liked_articles';

export default function ArticleActions({ articleId, likes, shares, views }: ArticleActionsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentViews, setCurrentViews] = useState(views ?? 0);
  const [isLoading, setIsLoading] = useState(false);

  // 检查 localStorage 是否已点赞
  useEffect(() => {
    const likedArticles = JSON.parse(localStorage.getItem(LIKED_ARTICLES_KEY) || '[]');
    setIsLiked(likedArticles.includes(articleId));
  }, [articleId]);

  // 记录页面访问（Webviso）
  useEffect(() => {
    if (isWebvisoEnabled()) {
      postVisit(articleId);
    }
  }, [articleId]);

  const handleLike = async () => {
    if (isLoading || isLiked) return;

    setIsLoading(true);

    // 乐观更新
    setIsLiked(true);
    setCurrentLikes(currentLikes + 1);

    try {
      if (isEmactionEnabled()) {
        await postReaction(articleId, 'thumbs-up', 1);
      }

      // 更新 localStorage
      const likedArticles = JSON.parse(localStorage.getItem(LIKED_ARTICLES_KEY) || '[]');
      if (!likedArticles.includes(articleId)) {
        likedArticles.push(articleId);
        localStorage.setItem(LIKED_ARTICLES_KEY, JSON.stringify(likedArticles));
      }
    } catch (error) {
      console.error('点赞失败:', error);
      setIsLiked(false);
      setCurrentLikes(currentLikes);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('utm_source', 'share');
      url.searchParams.set('utm_medium', 'social');

      const shareUrl = url.toString();

      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: shareUrl,
          });
        } catch {
          // 用户取消分享
        }
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('链接已复制到剪贴板！');
      }
    } catch {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板！');
    }
  };

  return (
    <div className="flex items-center gap-2 py-6 border-y border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isLoading || isLiked}
        className={cn(
          'gap-2',
          isLiked && 'text-red-500 hover:text-red-600'
        )}
      >
        <Heart className={cn('h-5 w-5', isLiked && 'fill-current')} />
        <span>{currentLikes}</span>
      </Button>

      {isWebvisoEnabled() && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 cursor-default"
        >
          <Eye className="h-5 w-5" />
          <span>{currentViews}</span>
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="gap-2"
      >
        <Share2 className="h-5 w-5" />
        <span>{shares}</span>
      </Button>
    </div>
  );
}
