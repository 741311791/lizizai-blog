'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Share2, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { postReaction, postVisit, isEmactionEnabled, isWebvisoEnabled } from '@/lib/services';
import { useArticleStats, bumpCachedLikes } from '@/hooks/useArticleStats';

interface ArticleActionsProps {
  articleId: string;
  likes: number;
}

const LIKED_ARTICLES_KEY = 'liked_articles';

/** localStorage 读取容错：存储污染时回退空列表 */
function readLikedArticles(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIKED_ARTICLES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ArticleActions({ articleId, likes }: ArticleActionsProps) {
  const t = useTranslations('article');
  const stats = useArticleStats(articleId, { likes, views: 0 });
  const [isLiked, setIsLiked] = useState(false);
  // 点赞乐观增量：真实值 = 服务端统计 + 本地增量，无需 effect 同步
  const [likeDelta, setLikeDelta] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const currentLikes = stats.likes + likeDelta;

  // 检查 localStorage 是否已点赞（微任务中同步，避免 effect 内同步 setState 级联渲染）
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLiked(readLikedArticles().includes(articleId));
    });
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  // 记录页面访问（ref 防御 StrictMode 双挂载重复计数）
  const visitedRef = useRef(false);
  useEffect(() => {
    if (visitedRef.current) return;
    visitedRef.current = true;
    if (isWebvisoEnabled()) {
      postVisit(articleId);
    }
  }, [articleId]);

  const handleLike = async () => {
    if (isLoading || isLiked) return;

    setIsLoading(true);

    // 乐观更新
    setIsLiked(true);
    setLikeDelta(d => d + 1);

    try {
      if (isEmactionEnabled()) {
        await postReaction(articleId, 'thumbs-up', 1);
        bumpCachedLikes(articleId, 1);
      }

      // 更新 localStorage
      const likedArticles = readLikedArticles();
      if (!likedArticles.includes(articleId)) {
        likedArticles.push(articleId);
        localStorage.setItem(LIKED_ARTICLES_KEY, JSON.stringify(likedArticles));
      }
    } catch (error) {
      console.error('点赞失败:', error);
      setIsLiked(false);
      // 函数式回滚：避免闭包旧值
      setLikeDelta(d => d - 1);
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
        toast.success(t('linkCopied'));
      }
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('linkCopied'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isLoading || isLiked}
        aria-pressed={isLiked}
        className={cn(
          'gap-1.5 h-10 px-3.5 tabular-nums',
          isLiked && 'text-red-500 hover:text-red-600'
        )}
      >
        <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} aria-hidden="true" />
        <span className="text-sm">{currentLikes}</span>
      </Button>

      {isWebvisoEnabled() && (
        <span className="inline-flex items-center gap-1.5 h-10 px-3.5 text-sm text-muted-foreground tabular-nums">
          <Eye className="h-4 w-4" aria-hidden="true" />
          {stats.views}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        aria-label={t('share')}
        className="gap-1.5 h-10 px-3.5"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
