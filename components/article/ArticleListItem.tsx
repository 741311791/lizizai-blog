'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Share2, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { getArticleImageUrl } from '@/lib/utils/image';
import { config } from '@/lib/env';
import type { Article } from '@/types/index';

// 避免 Radix DropdownMenu useId() hydration mismatch
const ShareMenu = dynamic(() => import('@/components/share/ShareMenu'), {
  ssr: false,
  loading: () => <div className="h-7 w-14" />,
});

interface ArticleListItemProps {
  article: Article;
}

export default function ArticleListItem({ article }: ArticleListItemProps) {
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
    readingTime,
    sharesCount = 0,
    category,
    tags,
  } = article;

  const [shares, setShares] = useState(sharesCount);
  const description = subtitle || excerpt;
  const imageUrl = getArticleImageUrl(featuredImage, id);
  const contentType = article.contentType || 'article';

  // 根据内容类型返回不同的时间描述
  const timeLabel =
    contentType === 'podcast'
      ? t('listenTime', { count: readingTime || 0 })
      : contentType === 'slides'
      ? t('slideCount', { count: article.slideCount || 0 })
      : t('readingTime', { count: readingTime || 0 });

  return (
    <Link href={`/article/${slug}`}>
      <article className="group flex gap-4 sm:gap-6 py-4 sm:py-6 border-b border-border transition-colors -mx-4 px-4">
        {/* 左侧内容 */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
          {/* 内容类型标识 + 标签 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {/* 播客/PPT 类型标识 */}
            {contentType === 'podcast' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                🎙️ {t('podcast')}
              </span>
            )}
            {contentType === 'slides' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                📊 {t('slideCount', { count: article.slideCount || 0 })}
              </span>
            )}
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{author.name}</span>
              <span>•</span>
              <span>
                {new Date(publishedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {(readingTime || contentType === 'slides') && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeLabel}</span>
                  </div>
                </>
              )}
            </div>
            {/* 分享按钮 */}
            <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <ShareMenu
                title={title}
                description={description}
                url={`${config.siteUrl}/article/${slug}`}
                onShare={() => setShares(prev => prev + 1)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Share2 className="h-3 w-3" />
                  <span>{shares}</span>
                </Button>
              </ShareMenu>
            </div>
          </div>
        </div>

        {/* 右侧图片 */}
        <div className="relative w-24 h-24 sm:w-40 sm:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized={imageUrl.includes('picsum.photos')}
          />
        </div>
      </article>
    </Link>
  );
}
