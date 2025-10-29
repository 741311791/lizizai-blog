'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArticleActionsProps {
  likes: number;
  commentsCount: number;
  shares: number;
}

export default function ArticleActions({ likes, commentsCount, shares }: ArticleActionsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setCurrentLikes(isLiked ? currentLikes - 1 : currentLikes + 1);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const scrollToComments = () => {
    const commentsSection = document.querySelector('#comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex items-center gap-2 py-6 border-y border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
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
        onClick={scrollToComments}
        className="gap-2"
      >
        <MessageCircle className="h-5 w-5" />
        <span>{commentsCount}</span>
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

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsBookmarked(!isBookmarked)}
        className={cn(
          'gap-2',
          isBookmarked && 'text-primary'
        )}
      >
        <Bookmark className={cn('h-5 w-5', isBookmarked && 'fill-current')} />
      </Button>
    </div>
  );
}
