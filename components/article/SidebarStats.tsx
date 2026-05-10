'use client';

import { useTranslations } from 'next-intl';
import type { Article } from '@/types/index';

interface SidebarStatsProps {
  article: Article;
}

/**
 * 侧边栏共享区块：浏览数据 + 标签
 * 被 PodcastSidebar 和 SlidesSidebar 复用
 */
export default function SidebarStats({ article }: SidebarStatsProps) {
  const t = useTranslations('article');

  return (
    <>
      {/* 浏览数据 */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t('readingStats')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-card p-2.5 text-center">
            <div className="text-lg font-bold">{article.views || 0}</div>
            <div className="text-[10px] text-muted-foreground">{t('views')}</div>
          </div>
          <div className="rounded-lg bg-card p-2.5 text-center">
            <div className="text-lg font-bold">{article.likes || 0}</div>
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
    </>
  );
}
