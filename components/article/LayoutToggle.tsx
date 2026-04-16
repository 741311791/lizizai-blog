'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3 gap-2',
          viewMode === 'list' && 'bg-accent'
        )}
        onClick={() => onViewModeChange('list')}
      >
        <List className="h-4 w-4" />
        <span className="text-xs font-medium">List</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3 gap-2',
          viewMode === 'grid' && 'bg-accent'
        )}
        onClick={() => onViewModeChange('grid')}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="text-xs font-medium">Grid</span>
      </Button>
    </div>
  );
}
