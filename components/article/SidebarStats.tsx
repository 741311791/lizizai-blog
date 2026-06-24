'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { Article } from '@/types/index';
import FeedSubscription from './FeedSubscription';
import { getContentType } from '@/lib/rss';
import { getReactions, getViews, isEmactionEnabled, isWebvisoEnabled } from '@/lib/services';

interface SidebarStatsProps {
  article: Article;
}

/**
 * 侧边栏共享区块：浏览数据 + 标签
 * 被 PodcastSidebar 和 SlidesSidebar 复用
 * 浏览量/点赞数客户端获取（避免服务端短 revalidate 拉低文章页 ISR）
 */
export default function SidebarStats({ article }: SidebarStatsProps) {
  const t = useTranslations('article');
  const [views, setViews] = useState(article.views || 0);
  const [likes, setLikes] = useState(article.likes || 0);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      const [reactions, v] = await Promise.all([
        isEmactionEnabled() ? getReactions(article.id) : Promise.resolve([]),
        isWebvisoEnabled() ? getViews(article.id) : Promise.resolve(0),
      ]);
      if (cancelled) return;
      setLikes(reactions.reduce((sum, r) => sum + r.count, 0));
      setViews(v);
    }
    loadStats();
    return () => { cancelled = true; };
  }, [article.id]);

  return (
    <>
      {/* 浏览数据 */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t('readingStats')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-card p-2.5 text-center">
            <div className="text-lg font-bold">{views}</div>
            <div className="text-[10px] text-muted-foreground">{t('views')}</div>
          </div>
          <div className="rounded-lg bg-card p-2.5 text-center">
            <div className="text-lg font-bold">{likes}</div>
            <div className="text-[10px] text-muted-foreground">{t('likes')}</div>
          </div>
        </div>
      </div>

      {/* 标签 */}
      {article.tags && article.tags.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('tagsLabel')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map(tag => (
              <span
                key={tag.slug}
                className="px-2.5 py-0.5 bg-card border border-border rounded-full text-xs text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* RSS 订阅 */}
      <FeedSubscription
        contentType={getContentType(article)}
        categorySlug={article.category?.slug || ''}
        categoryName={article.category?.name || ''}
      />
    </>
  );
}
