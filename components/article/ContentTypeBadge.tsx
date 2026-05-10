'use client';

import { Badge } from '@/components/ui/badge';
import { BookOpen, Mic, Presentation } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ContentType } from '@/types/index';

interface ContentTypeBadgeProps {
  contentType?: ContentType;
  categoryName?: string;
  /** 紧凑模式：仅显示图标+简短文字，用于列表项等空间有限场景 */
  compact?: boolean;
  /** 幻灯片页数（compact 模式下显示） */
  slideCount?: number;
  className?: string;
}

/**
 * 内容类型徽章
 *
 * 根据 contentType 显示不同的标识。
 * 支持标准模式和紧凑模式（compact）。
 */
export default function ContentTypeBadge({
  contentType,
  categoryName,
  compact = false,
  slideCount,
  className,
}: ContentTypeBadgeProps) {
  const t = useTranslations('article');

  switch (contentType) {
    case 'podcast':
      return (
        <Badge variant="secondary" className={`gap-1 ${className || ''}`}>
          <Mic className="size-3" />
          {compact ? t('podcast') : t('podcast')}
        </Badge>
      );
    case 'slides':
      return (
        <Badge variant="secondary" className={`gap-1 ${className || ''}`}>
          <Presentation className="size-3" />
          {compact && slideCount ? t('slideCount', { count: slideCount }) : t('slides')}
        </Badge>
      );
    default:
      if (categoryName) {
        return (
          <Badge variant="secondary" className={`gap-1 ${className || ''}`}>
            <BookOpen className="size-3" />
            {categoryName}
          </Badge>
        );
      }
      if (!compact) {
        return (
          <Badge variant="secondary" className={`gap-1 ${className || ''}`}>
            <BookOpen className="size-3" />
            {t('articleType')}
          </Badge>
        );
      }
      return null;
  }
}
