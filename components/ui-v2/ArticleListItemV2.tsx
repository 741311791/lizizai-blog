'use client';

/**
 * ArticleListItemV2 — 列表视图行条目（编辑风升级版，预览组件）
 * 日期 mono 小标 + tags hairline 胶囊 + ContentTypeBadgeV2；交互逻辑（分享/懒加载/memo）同 ArticleListItem
 */

import dynamic from 'next/dynamic';
import { memo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Share2, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { getCardImageUrl, shouldSkipImageOptimization } from '@/lib/utils/image';
import ContentTypeBadgeV2 from '@/components/ui-v2/ContentTypeBadgeV2';
import { getTimeLabel } from '@/lib/content-utils';
import { config } from '@/lib/env';
import type { Article } from '@/types/index';

// 避免 Radix DropdownMenu useId() hydration mismatch
const ShareMenu = dynamic(() => import('@/components/share/ShareMenu'), {
  ssr: false,
  loading: () => <div className="h-7 w-14" />,
});

interface ArticleListItemV2Props {
  article: Article;
  /** 列表首项缩略图是 LCP 候选，传 true 提升加载优先级 */
  priority?: boolean;
}

function ArticleListItemV2({ article, priority = false }: ArticleListItemV2Props) {
  const t = useTranslations('article');
  const locale = useLocale();
  const {
    id,
    title,
    subtitle,
    excerpt,
    slug,
    featuredImage,
    thumbnailImage,
    author,
    publishedAt,
    readingTime,
    sharesCount = 0,
    tags,
  } = article;

  const [shares, setShares] = useState(sharesCount);
  const description = subtitle || excerpt;
  const imageUrl = getCardImageUrl(thumbnailImage, featuredImage, id);
  const contentType = article.contentType || 'article';
  const timeLabel = getTimeLabel(t, article.contentType, readingTime || 0, article.slideCount);

  return (
    // 标题链接用 after 撑满整项点击区，分享按钮以 z-10 浮层脱离嵌套
    <article className="group relative flex gap-4 border-b border-border px-4 py-4 transition-colors sm:gap-6 sm:py-6 -mx-4">
      {/* 左侧内容 */}
      <div className="min-w-0 flex-1">
        <h2 className="text-balance mb-2 line-clamp-2 text-xl font-bold transition-colors group-hover:text-primary">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h2>
        {description && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        )}
        {/* 内容类型标识 + 标签 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <ContentTypeBadgeV2 article={article} compact />
          {tags && tags.slice(0, 3).map((tag) => (
            <span
              key={tag.slug}
              className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] leading-none text-muted-foreground"
            >
              {tag.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 作者、日期（mono 小标）、时间描述 — 纯留白分隔；窄屏收紧间距防折行，阅读时间 <420px 让位 */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4 text-xs text-muted-foreground">
            <span className="font-medium whitespace-nowrap">{author.name}</span>
            <span className="font-mono text-[11px] tracking-[0.1em] tabular-nums whitespace-nowrap">
              {new Date(publishedAt).toISOString().slice(0, 10)}
            </span>
            {(readingTime || contentType === 'slides') && (
              <>
                <div className="hidden min-[420px]:flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span className="tabular-nums whitespace-nowrap">{timeLabel}</span>
                </div>
              </>
            )}
          </div>
          {/* 分享按钮 */}
          <div className="relative z-10 flex flex-shrink-0 items-center gap-2 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <ShareMenu
              title={title}
              description={description}
              url={`${config.siteUrl}/article/${slug}`}
              onShare={() => setShares(prev => prev + 1)}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs tabular-nums active:scale-[0.96]"
              >
                <Share2 className="h-3 w-3" />
                <span>{shares}</span>
              </Button>
            </ShareMenu>
          </div>
        </div>
      </div>

      {/* 右侧图片 — 纯白 1px 描边 */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-white/10 sm:h-40 sm:w-40">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 96px, 160px"
          priority={priority}
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized={shouldSkipImageOptimization(imageUrl)}
        />
      </div>
    </article>
  );
}

// memo：article 引用不变时跳过重渲染（viewMode/tab 切换不触发列表项重渲染）
export default memo(ArticleListItemV2);
