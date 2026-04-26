/**
 * AI 资讯头条卡片组件
 *
 * importance=2 的头条资讯，水平布局：左侧封面图 + 右侧内容。
 * 用于首页和归档页。
 */

import Image from 'next/image';
import { getTagVisual, getCoverFallbackVisual } from '@/lib/tag-visuals';
import { Link } from '@/i18n/navigation';
import type { AiNews } from '@/types/index';

interface DailyNewsFeaturedProps {
  item: AiNews;
  /** locale 用于日期格式化 */
  locale?: string;
}

export default function DailyNewsFeatured({ item, locale = 'zh' }: DailyNewsFeaturedProps) {
  const hasCover = Boolean(item.coverUrl);
  const fallback = getCoverFallbackVisual(item.tags);
  const FallbackIcon = fallback.icon;

  // 格式化日期
  const dateStr = item.date
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
      className="group block rounded-xl border border-border bg-card overflow-hidden border-l-4 border-l-accent hover:shadow-lg transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row">
        {/* 封面图区域 */}
        <div className="relative w-full sm:w-64 md:w-80 flex-shrink-0 aspect-video sm:aspect-auto">
          {hasCover ? (
            <Image
              src={item.coverUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className={`w-full h-full min-h-[160px] bg-gradient-to-br ${fallback.gradient} flex items-center justify-center`}>
              <FallbackIcon className="w-10 h-10 text-white/30" />
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-5 sm:p-6 space-y-3">
          {/* 标题 */}
          <h3 className="text-lg font-semibold leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>

          {/* 摘要 */}
          {item.summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {item.summary}
            </p>
          )}

          {/* 来源 + 日期 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.tags.slice(0, 4).map((tag) => {
                const visual = getTagVisual(tag);
                return (
                  <Link
                    key={tag}
                    href={`/ai-news?tag=${tag}`}
                    className={`px-2 py-0.5 rounded-full text-xs ${visual.labelBg} ${visual.labelColor} hover:opacity-80 transition-opacity`}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    {visual.label}
                  </Link>
                );
              })}
              {item.tags.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{item.tags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
