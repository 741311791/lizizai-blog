'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface LayoutToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function LayoutToggle({
  viewMode,
  onViewModeChange,
}: LayoutToggleProps) {
  const t = useTranslations('article');

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={viewMode === 'list'}
        className={cn(
          'h-9 gap-2',
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
          'h-9 gap-2',
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
