'use client';

import { useTranslations } from 'next-intl';
import { formatTime } from '@/lib/utils/format';
import SidebarStats from './SidebarStats';
import type { Article } from '@/types/index';

interface PodcastSidebarProps {
  article: Article;
  activeChapterIndex: number;
  onChapterClick: (startTime: number) => void;
  currentTime: number;
}

/**
 * 播客侧边栏
 * 章节导航 + 正在播放指示 + 数据 + 标签
 */
export default function PodcastSidebar({
  article,
  activeChapterIndex,
  onChapterClick,
  currentTime,
}: PodcastSidebarProps) {
  const t = useTranslations('article');
  const chapters = article.chapters || [];
  const remaining = article.audioDuration
    ? Math.max(0, Math.ceil((article.audioDuration - currentTime) / 60))
    : 0;

  return (
    <div className="space-y-6">
      {/* 章节导航 */}
      {chapters.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('chapters')}
          </h3>
          <ul className="space-y-0">
            {chapters.map((ch, idx) => (
              <li
                key={ch.id}
                onClick={() => onChapterClick(ch.startTime)}
                className={`flex items-start gap-2.5 py-2 text-sm border-b border-border cursor-pointer transition-colors ${
                  idx === activeChapterIndex
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="text-xs tabular-nums min-w-[36px] flex-shrink-0 text-muted-foreground">
                  {formatTime(ch.startTime)}
                </span>
                <span className="leading-snug">{ch.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 正在播放 */}
      <div className="rounded-lg bg-card p-3 flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold">
            {activeChapterIndex >= 0 && chapters[activeChapterIndex]
              ? `${formatTime(chapters[activeChapterIndex].startTime)} ${chapters[activeChapterIndex].title}`
              : t('nowPlaying')
            }
          </div>
          {remaining > 0 && (
            <div className="text-xs text-muted-foreground">
              {t('remaining', { minutes: remaining })}
            </div>
          )}
        </div>
      </div>

      {/* 浏览数据 + 标签 */}
      <SidebarStats article={article} />
    </div>
  );
}
