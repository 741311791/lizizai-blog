'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVisitorId } from '@/lib/visitor';
import { api } from '@/lib/api';

interface ArticleActionsProps {
  articleId: string;
  likes: number;
  shares: number;
}

const LIKED_ARTICLES_KEY = 'liked_articles';

export default function ArticleActions({ articleId, likes, shares }: ArticleActionsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [isLoading, setIsLoading] = useState(false);

  // Check if article is already liked on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const likedArticles = JSON.parse(localStorage.getItem(LIKED_ARTICLES_KEY) || '[]');
        setIsLiked(likedArticles.includes(articleId));
      } catch (error) {
        console.error('Failed to load liked articles:', error);
      }
    }
  }, [articleId]);

  const handleLike = async () => {
    if (isLoading || isLiked) return;

    setIsLoading(true);

    try {
      const visitorId = getVisitorId();
      
      if (!visitorId) {
        console.error('Failed to get visitor ID');
        return;
      }

      // Optimistic update
      setIsLiked(true);
      setCurrentLikes(currentLikes + 1);

      // Call API
      const response = await api.likeArticle(articleId, visitorId);

      if (response.success) {
        // Update localStorage
        const likedArticles = JSON.parse(localStorage.getItem(LIKED_ARTICLES_KEY) || '[]');
        likedArticles.push(articleId);
        localStorage.setItem(LIKED_ARTICLES_KEY, JSON.stringify(likedArticles));
        
        // Update likes count from server
        if (response.likes !== undefined) {
          setCurrentLikes(response.likes);
        }
      } else if (response.alreadyLiked) {
        // Already liked, just update UI
        console.log('Article already liked');
      } else if (response.rateLimited) {
        // Rate limited, revert optimistic update
        setIsLiked(false);
        setCurrentLikes(currentLikes);
        alert('Please wait before liking again.');
      }
    } catch (error) {
      console.error('Failed to like article:', error);
      // Revert optimistic update on error
      setIsLiked(false);
      setCurrentLikes(currentLikes);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const visitorId = getVisitorId();
      
      // Build share URL with tracking parameters
      const url = new URL(window.location.href);
      url.searchParams.set('utm_source', 'share');
      url.searchParams.set('utm_medium', 'social');
      url.searchParams.set('utm_campaign', 'article_share');
      if (visitorId) {
        url.searchParams.set('shared_by', visitorId);
      }
      
      const shareUrl = url.toString();
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: shareUrl,
          });
        } catch (error) {
          console.log('Share cancelled');
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to simple URL copy
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
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
