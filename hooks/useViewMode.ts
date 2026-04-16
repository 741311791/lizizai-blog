'use client';

import { useState, useEffect } from 'react';

export type ViewMode = 'grid' | 'list';

const VIEW_MODE_KEY = 'article-view-mode';

export function useViewMode(defaultMode: ViewMode = 'list'): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 从 localStorage 读取用户偏好
    const savedMode = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
    if (savedMode === 'grid' || savedMode === 'list') {
      setViewMode(savedMode);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mounted) {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    }
  };

  return [viewMode, handleViewModeChange];
}
