'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type ViewMode = 'grid' | 'list';

const VIEW_MODE_KEY = 'article-view-mode';

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((l) => l());
}

function isViewMode(v: string | null): v is ViewMode {
  return v === 'grid' || v === 'list';
}

/**
 * 视图偏好（grid/list）全局同步。
 * useSyncExternalStore：hydration 后立即应用 localStorage 偏好，
 * 避免「先渲染 list 再跳 grid」的布局闪变。
 */
export function useViewMode(defaultMode: ViewMode = 'list'): [ViewMode, (mode: ViewMode) => void] {
  const viewMode = useSyncExternalStore(
    subscribe,
    () => {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      return isViewMode(saved) ? saved : defaultMode;
    },
    () => defaultMode
  );

  const setViewMode = useCallback((mode: ViewMode) => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    emitChange();
  }, []);

  return [viewMode, setViewMode];
}
