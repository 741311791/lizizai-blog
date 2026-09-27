'use client';

import { useEffect, useState } from 'react';
import { getReactions, getViews, isEmactionEnabled, isWebvisoEnabled } from '@/lib/services';

export interface ArticleStats {
  likes: number;
  views: number;
}

/**
 * 文章浏览/点赞数据客户端获取。
 * 模块级缓存 + 在途 Promise 去重：同一页面内 ArticleActions 与 SidebarStats
 * 双挂载时对 emaction/Webviso 只发一次请求。
 */
const statsCache = new Map<string, ArticleStats>();
const inflight = new Map<string, Promise<ArticleStats>>();

function fetchStats(articleId: string): Promise<ArticleStats> {
  let p = inflight.get(articleId);
  if (p) return p;
  p = (async () => {
    const [reactions, views] = await Promise.all([
      isEmactionEnabled() ? getReactions(articleId) : Promise.resolve([]),
      isWebvisoEnabled() ? getViews(articleId) : Promise.resolve(0),
    ]);
    const stats = { likes: reactions.reduce((sum, r) => sum + r.count, 0), views };
    statsCache.set(articleId, stats);
    inflight.delete(articleId);
    return stats;
  })();
  inflight.set(articleId, p);
  return p;
}

/** 点赞成功后同步缓存（避免其他挂载点回读旧值） */
export function bumpCachedLikes(articleId: string, diff: number) {
  const cached = statsCache.get(articleId);
  if (cached) {
    statsCache.set(articleId, { ...cached, likes: Math.max(0, cached.likes + diff) });
  }
}

export function useArticleStats(
  articleId: string,
  /** 服务端下发的初始值（fetch 返回前显示，避免 0 闪变） */
  initial: ArticleStats = { likes: 0, views: 0 }
): ArticleStats {
  const [stats, setStats] = useState<ArticleStats>(() => statsCache.get(articleId) ?? initial);

  useEffect(() => {
    let cancelled = false;
    fetchStats(articleId).then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  return stats;
}
