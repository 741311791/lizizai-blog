'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Heart, Share2, MessageCircle, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getArticleImageUrl } from '@/lib/utils/image';
import dynamic from 'next/dynamic';
const ShareMenu = dynamic(() => import('@/components/share/ShareMenu'), { ssr: false });
import { config } from '@/lib/env';
import type { Article } from '@/types/index';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const t = useTranslations('article');
  const locale = useLocale();
  const {
    id,
    title,
    subtitle,
    excerpt,
    slug,
    featuredImage,
    author,
    publishedAt,
    likes,
    commentsCount = 0,
    readingTime,
    sharesCount = 0,
    category,
    tags,
  } = article;

  const [shares, setShares] = useState(sharesCount);
  const description = subtitle || excerpt;
  const imageUrl = getArticleImageUrl(featuredImage, id);
  const contentType = article.contentType || 'article';

  return (
    <Card className="group overflow-hidden border-border bg-card hover:bg-card transition-colors duration-200 h-full flex flex-col">
      <Link href={`/article/${slug}`} className="flex flex-col h-full">
        {/* 封面图区域 */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={imageUrl.includes('picsum.photos')}
          />

          {/* 内容类型 / 分类标签 */}
          {contentType === 'podcast' ? (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 text-xs bg-accent/80 text-accent-foreground backdrop-blur-sm hover:bg-accent/80"
            >
              🎙️ {t('podcast')}
            </Badge>
          ) : contentType === 'slides' ? (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 text-xs bg-accent/80 text-accent-foreground backdrop-blur-sm hover:bg-accent/80"
            >
              📊 {t('slides')}
            </Badge>
          ) : category ? (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 text-xs bg-accent/80 text-accent-foreground backdrop-blur-sm hover:bg-accent/80"
            >
              {category.name}
            </Badge>
          ) : null}

          {/* Hover 覆盖层 - 桌面端显示 */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-center gap-6">
            <ShareMenu
              title={title}
              description={description}
              url={`${config.siteUrl}/article/${slug}`}
              onShare={() => setShares(prev => prev + 1)}
            >
              <button
                className="flex flex-col items-center gap-1 text-white/90 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Share2 className="h-5 w-5" />
                <span className="text-xs">{shares}</span>
              </button>
            </ShareMenu>

            <div className="flex flex-col items-center gap-1 text-white/90">
              <Heart className="h-5 w-5" />
              <span className="text-xs">{likes}</span>
            </div>

            <div className="flex flex-col items-center gap-1 text-white/90">
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">{commentsCount}</span>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-5 flex flex-col flex-1">
          {/* 标题 */}
          <h3 className="mb-2 text-lg font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* 摘要 */}
          {description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
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
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{author.name}</span>
              <span>·</span>
              <span>
                {new Date(publishedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* 移动端显示互动数据 */}
              <span className="flex items-center gap-1 sm:hidden">
                <Heart className="h-3 w-3" />{likes}
              </span>
              <span className="flex items-center gap-1 sm:hidden">
                <MessageCircle className="h-3 w-3" />{commentsCount}
              </span>
              {readingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
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
      </Link>
    </Card>
  );
}
