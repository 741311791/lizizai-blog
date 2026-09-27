'use client';

import dynamic from 'next/dynamic';
import { memo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Share2, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { getCardImageUrl, shouldSkipImageOptimization } from '@/lib/utils/image';
import ContentTypeBadge from './ContentTypeBadge';
import { getTimeLabel } from '@/lib/content-utils';
import { config } from '@/lib/env';
import type { Article } from '@/types/index';

// 避免 Radix DropdownMenu useId() hydration mismatch
const ShareMenu = dynamic(() => import('@/components/share/ShareMenu'), {
  ssr: false,
  loading: () => <div className="h-7 w-14" />,
});

// 模块级 formatter 单例：避免每项每次渲染重建 Intl.DateTimeFormat
const dateFormatters: Record<string, Intl.DateTimeFormat> = {
  zh: new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }),
  en: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }),
};

interface ArticleListItemProps {
  article: Article;
  /** 列表首项缩略图是 LCP 候选，传 true 提升加载优先级 */
  priority?: boolean;
}

function ArticleListItem({ article, priority = false }: ArticleListItemProps) {
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
    <article className="group relative flex gap-4 sm:gap-6 py-4 sm:py-6 border-b border-border transition-colors -mx-4 px-4">
      {/* 左侧内容 */}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors text-balance">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed text-pretty">
            {description}
          </p>
        )}
        {/* 内容类型标识 + 标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <ContentTypeBadge
            article={article}
            compact
          />
          {tags && tags.slice(0, 3).map((tag) => (
            <span
              key={tag.slug}
              className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md"
            >
              {tag.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {/* 作者、日期、时间描述 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
            <span className="font-medium">{author.name}</span>
            <span>•</span>
            <span>
              {dateFormatters[locale === 'zh' ? 'zh' : 'en'].format(new Date(publishedAt))}
            </span>
            {(readingTime || contentType === 'slides') && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span>{timeLabel}</span>
                </div>
              </>
            )}
          </div>
          {/* 分享按钮 */}
          <div className="relative z-10 flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
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
      <div className="relative w-24 h-24 sm:w-40 sm:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-white/10">
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
export default memo(ArticleListItem);
