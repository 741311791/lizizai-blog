'use client';

import { BookOpen, Mic, Presentation } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ContentTypes } from '@/types/index';

interface ContentTypeSwitcherProps {
  contentTypes?: ContentTypes;
  activeType: string;
  onTypeChange?: (type: string) => void;
}

/**
 * 内容类型切换器
 * 根据 contentTypes 动态显示可用按钮（文章始终显示，播客/PPT 按需显示）
 * 兼容旧数据：contentTypes 为空时回退到三按钮模式
 */
export default function ContentTypeSwitcher({ contentTypes, activeType, onTypeChange }: ContentTypeSwitcherProps) {
  const t = useTranslations('article');

  // 基础选项
  const allOptions = [
    { key: 'article', label: t('articleType'), Icon: BookOpen },
    { key: 'podcast', label: t('podcast'), Icon: Mic },
    { key: 'slides', label: t('slides'), Icon: Presentation },
  ];

  // 根据 contentTypes 过滤可用选项
  const options = contentTypes
    ? allOptions.filter(opt => {
        if (opt.key === 'article') return true;
        if (opt.key === 'podcast') return !!contentTypes.podcast;
        if (opt.key === 'slides') return !!contentTypes.slides;
        return true;
      })
    : allOptions;

  // 只有一个选项时无需显示切换器
  if (options.length <= 1) return null;

  return (
    <>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {t('contentFormat')}
      </div>
      <div className="flex gap-1 bg-card rounded-lg p-1">
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => onTypeChange?.(opt.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-center text-[11px] rounded-md transition-colors cursor-pointer ${
              activeType === opt.key
                ? 'bg-secondary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <opt.Icon className="size-3.5" />
            {opt.label}
          </button>
        ))}
      </div>
    </>
  );
}
