'use client';

import { memo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Heart, Share2, MessageCircle, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { getCardImageUrl, shouldSkipImageOptimization } from '@/lib/utils/image';
import dynamic from 'next/dynamic';
const ShareMenu = dynamic(() => import('@/components/share/ShareMenu'), { ssr: false });
import { config } from '@/lib/env';
import type { ArticleCardData } from '@/types/index';

interface ArticleCardProps {
  article: ArticleCardData;
}

// 模块级 formatter 单例：避免每张卡片每次渲染重建 Intl.DateTimeFormat
const dateFormatters: Record<string, Intl.DateTimeFormat> = {
  zh: new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }),
  en: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }),
};

function ArticleCard({ article }: ArticleCardProps) {
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
    likes,
    commentsCount = 0,
    readingTime,
    sharesCount = 0,
    tags,
  } = article;

  const [shares, setShares] = useState(sharesCount);
  const description = subtitle || excerpt;
  const imageUrl = getCardImageUrl(thumbnailImage, featuredImage, id);
  const contentType = article.contentType || 'article';

  return (
    <Card className="group relative overflow-hidden border-border bg-card hover:bg-card transition-colors duration-200 h-full flex flex-col">
      {/* 封面图区域 — 纯白 1px 描边增加与卡片的层次 */}
      <div className="relative aspect-video overflow-hidden bg-muted ring-1 ring-white/10">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={shouldSkipImageOptimization(imageUrl)}
        />

        {/* Hover 覆盖层 - 桌面端显示；分享按钮独立于卡片链接，不构成嵌套交互元素 */}
        <div className="absolute inset-0 z-10 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center gap-6">
          <ShareMenu
            title={title}
            description={description}
            url={`${config.siteUrl}/article/${slug}`}
            onShare={() => setShares(prev => prev + 1)}
          >
            <button className="flex flex-col items-center gap-1 text-white/90 hover:text-white transition-[color,transform] active:scale-[0.96]">
              <Share2 className="h-5 w-5" />
              <span className="text-xs tabular-nums">{shares}</span>
            </button>
          </ShareMenu>

          {/* 点赞/评论数为展示信息 */}
          <span className="flex flex-col items-center gap-1 text-white/90">
            <Heart className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs tabular-nums">{likes}</span>
          </span>

          <span className="flex flex-col items-center gap-1 text-white/90">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs tabular-nums">{commentsCount}</span>
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-5 flex flex-col flex-1">
        {/* 标题链接用 after 撑满整卡点击区，操作按钮以 z-10 浮层脱离嵌套 */}
        <h3 className="mb-2 text-lg font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors text-balance">
          <Link href={`/article/${slug}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        </h3>

        {/* 摘要 */}
        {description && (
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed text-pretty">
            {description}
          </p>
        )}

        {/* 标签 */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.slug}
                className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 底部信息 */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 tabular-nums">
            <span className="font-medium">{author.name}</span>
            <span>·</span>
            <span>
              {dateFormatters[locale === 'zh' ? 'zh' : 'en'].format(new Date(publishedAt))}
            </span>
          </div>
          <div className="flex items-center gap-3 tabular-nums">
            {/* 移动端显示互动数据 */}
            <span className="flex items-center gap-1 sm:hidden">
              <Heart className="h-3 w-3" aria-hidden="true" />{likes}
            </span>
            <span className="flex items-center gap-1 sm:hidden">
              <MessageCircle className="h-3 w-3" aria-hidden="true" />{commentsCount}
            </span>
            {readingTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>
                  {contentType === 'podcast'
                    ? t('listenTime', { count: readingTime })
                    : contentType === 'slides'
                    ? t('slideCount', { count: article.slideCount || 0 })
                    : t('readingTime', { count: readingTime })
                    }
                  </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// memo：article 引用不变时跳过重渲染（viewMode/tab 切换不触发卡片重渲染）
export default memo(ArticleCard);
