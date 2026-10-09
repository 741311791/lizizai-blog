'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import type { Article } from '@/types/index';
import FeedSubscription from './FeedSubscription';
import SidebarSectionTitle from './SidebarSectionTitle';
import { getContentType } from '@/lib/rss';
import { useArticleStats } from '@/hooks/useArticleStats';

interface SidebarStatsProps {
  article: Article;
  /** HTML 内容类型没有对应 RSS feed，传 false 隐藏订阅区块 */
  showFeeds?: boolean;
}

/**
 * 侧边栏共享区块：浏览数据 + 标签
 * 被 PodcastSidebar 和 SlidesSidebar 复用
 * 浏览量/点赞数客户端获取（避免服务端短 revalidate 拉低文章页 ISR）
 */
function SidebarStats({ article, showFeeds = true }: SidebarStatsProps) {
  const t = useTranslations('article');
  // 与 ArticleActions 共享模块级去重缓存，双挂载只发一次请求；服务端值作种子避免 0 闪变
  const stats = useArticleStats(article.id, { likes: article.likes, views: article.views || 0 });
  const views = stats.views;
  const likes = stats.likes;

  return (
    <>
      {/* 浏览数据 */}
      <div>
        <SidebarSectionTitle eyebrow="Stats" title={t('readingStats')} />
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-card p-2.5 text-center">
            <div className="text-lg font-bold tabular-nums">{views}</div>
            <div className="text-[10px] text-muted-foreground">{t('views')}</div>
          </div>
          <div className="rounded-lg bg-card p-2.5 text-center">
            <div className="text-lg font-bold tabular-nums">{likes}</div>
            <div className="text-[10px] text-muted-foreground">{t('likes')}</div>
          </div>
        </div>
      </div>

      {/* 标签 */}
      {article.tags && article.tags.length > 0 && (
        <div>
          <SidebarSectionTitle eyebrow="Tags" title={t('tagsLabel')} />
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
      {showFeeds && (
        <FeedSubscription
          contentType={getContentType(article)}
          categorySlug={article.category?.slug || ''}
          categoryName={article.category?.name || ''}
        />
      )}
    </>
  );
}

// memo：article 引用稳定，播放进度等高频状态变化不触发本区块重渲
export default memo(SidebarStats);
