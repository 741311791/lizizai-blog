'use client';

/**
 * LayoutToggleV2 — 网格/列表视图切换器（编辑风升级版，预览组件）
 * 圆角锐化 rounded-sm，与订阅按钮等编辑风容器语言统一；交互逻辑同 LayoutToggle
 */

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/hooks/useViewMode';

interface LayoutToggleV2Props {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function LayoutToggleV2({
  viewMode,
  onViewModeChange,
}: LayoutToggleV2Props) {
  const t = useTranslations('article');

  return (
    <div className="flex items-center gap-1 rounded-sm border border-border bg-background p-1">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={viewMode === 'list'}
        className={cn(
          'h-9 gap-2 rounded-sm',
          viewMode === 'list' && 'bg-accent'
        )}
        onClick={() => onViewModeChange('list')}
      >
        <List className="h-4 w-4" />
        <span className="text-xs font-medium">{t('viewList')}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={viewMode === 'grid'}
        className={cn(
          'h-9 gap-2 rounded-sm',
          viewMode === 'grid' && 'bg-accent'
        )}
        onClick={() => onViewModeChange('grid')}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="text-xs font-medium">{t('viewGrid')}</span>
      </Button>
    </div>
  );
}
