/**
 * AI 资讯卡片组件
 *
 * 普通资讯卡片，支持封面图和标签渐变兜底。
 * 用于首页网格和归档页列表。
 */

import Image from 'next/image';
import { getTagVisual, getCoverFallbackVisual } from '@/lib/tag-visuals';
import { Link } from '@/i18n/navigation';
import type { AiNews } from '@/types/index';

interface DailyNewsCardProps {
  item: AiNews;
  /** 是否显示日期（归档页需要） */
  showDate?: boolean;
  /** locale 用于日期格式化 */
  locale?: string;
}

export default function DailyNewsCard({ item, showDate = false, locale = 'zh' }: DailyNewsCardProps) {
  const hasCover = Boolean(item.coverUrl);
  const fallback = getCoverFallbackVisual(item.tags);
  const FallbackIcon = fallback.icon;

  // 格式化日期
  const dateStr = showDate && item.date
    ? new Date(item.date + 'T00:00:00').toLocaleDateString(
        locale === 'zh' ? 'zh-CN' : 'en-US',
        { month: 'short', day: '2-digit' }
      )
    : '';

  return (
    <a
      href={item.sourceUrl || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
    >
      {/* 封面图区域 */}
      <div className="relative aspect-video overflow-hidden">
        {hasCover ? (
          <Image
            src={item.coverUrl}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          // 兜底：分类主题渐变色块 + 图标
          <div className={`w-full h-full bg-gradient-to-br ${fallback.gradient} flex items-center justify-center`}>
            <FallbackIcon className="w-8 h-8 text-white/30" />
          </div>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-4 space-y-2">
        {/* 标题 */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">
          {item.title}
        </h3>

        {/* 底部信息：来源 + 标签 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {item.sourceName && <span>{item.sourceName}</span>}
          {dateStr && (
            <>
              {item.sourceName && <span>·</span>}
              <span>{dateStr}</span>
            </>
          )}
        </div>

        {/* 标签列表（可点击跳转归档页筛选） */}
        {item.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {item.tags.slice(0, 3).map((tag) => {
              const visual = getTagVisual(tag);
              return (
                <Link
                  key={tag}
                  href={`/ai-news?tag=${tag}`}
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${visual.labelBg} ${visual.labelColor} hover:opacity-80 transition-opacity`}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  {visual.label}
                </Link>
              );
            })}
            {item.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  );
}
