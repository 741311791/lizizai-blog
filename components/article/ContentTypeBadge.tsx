'use client';

import { Badge } from '@/components/ui/badge';
import { BookOpen, Mic, Presentation } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Article } from '@/types/index';

interface ContentTypeBadgeProps {
  /** 文章对象，自动推断所有内容类型 */
  article?: Article;
  /** 兼容旧调用：单个 contentType */
  contentType?: string;
  categoryName?: string;
  compact?: boolean;
  className?: string;
}

/**
 * 内容类型徽章
 *
 * 支持同时展示多种类型（如 podcast + slides）。
 * article 类型在 compact 模式下不显示。
 */
export default function ContentTypeBadge({
  article,
  contentType,
  categoryName,
  compact = false,
  className,
}: ContentTypeBadgeProps) {
  const t = useTranslations('article');

  // 从 article 对象推断类型集合
  const types = new Set<string>();
  if (article?.contentTypes) {
    if (article.contentTypes.podcast) types.add('podcast');
    if (article.contentTypes.slides) types.add('slides');
    if (article.contentTypes.article) types.add('article');
  }
  // 兼容旧调用和旧数据
  if (types.size === 0 && (contentType || article?.contentType)) {
    types.add(contentType || article?.contentType || 'article');
  }
  if (types.size === 0) types.add('article');

  const badges: React.ReactNode[] = [];

  if (types.has('podcast')) {
    badges.push(
      <Badge key="podcast" variant="secondary" className={`gap-1 ${className || ''}`}>
        <Mic className="size-3" />
        {t('podcast')}
      </Badge>
    );
  }

  if (types.has('slides')) {
    badges.push(
      <Badge key="slides" variant="secondary" className={`gap-1 ${className || ''}`}>
        <Presentation className="size-3" />
        {t('slides')}
      </Badge>
    );
  }

  // article 类型：仅在非 compact 或有 categoryName 时显示
  if (types.has('article') && !types.has('podcast') && !types.has('slides')) {
    if (categoryName) {
      badges.push(
        <Badge key="article" variant="secondary" className={`gap-1 ${className || ''}`}>
          <BookOpen className="size-3" />
          {categoryName}
        </Badge>
      );
    } else if (!compact) {
      badges.push(
        <Badge key="article" variant="secondary" className={`gap-1 ${className || ''}`}>
          <BookOpen className="size-3" />
          {t('articleType')}
        </Badge>
      );
    }
    return badges.length > 0 ? <>{badges}</> : null;
  }

  // 如果 article 类型与 podcast/slides 共存，不显示 article badge
  if (types.has('article') && (types.has('podcast') || types.has('slides')) && categoryName) {
    badges.push(
      <Badge key="category" variant="secondary" className={`gap-1 ${className || ''}`}>
        <BookOpen className="size-3" />
        {categoryName}
      </Badge>
    );
  }

  return badges.length > 0 ? <>{badges}</> : null;
}
