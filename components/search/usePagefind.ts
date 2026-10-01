'use client';

import { useState, useCallback, useRef } from 'react';

interface SearchResult {
  url: string;
  title: string;
  excerpt: string;
  meta?: {
    category?: string;
  };
}

interface PagefindInstance {
  search: (query: string) => Promise<{
    results: Array<{
      url: string;
      data: () => Promise<{
        meta: { title: string; category?: string };
        excerpt: string;
        url: string;
        sub_results: Array<{
          title: string;
          url: string;
          excerpt: string;
        }>;
      }>;
    }>;
  }>;
}

let pagefindPromise: Promise<PagefindInstance> | null = null;

function loadPagefind(): Promise<PagefindInstance> {
  if (pagefindPromise) return pagefindPromise;

  // pagefind 1.5+ 打包为 ES module（内含 import.meta），须用动态 import 加载；
  // 普通 <script> 标签会抛 "Cannot use 'import.meta' outside a module" 导致搜索永远为空
  pagefindPromise = (async () => {
    if (typeof window === 'undefined') {
      return { search: async () => ({ results: [] }) };
    }
    try {
      // 变量路径让 tsc 不做模块解析（字面量会报 TS2307），打包器靠忽略注释跳过
      const pagefindUrl = '/pagefind/pagefind.js';
      const mod = (await import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */ pagefindUrl
      )) as unknown as PagefindInstance & { pagefind?: PagefindInstance };
      return mod.pagefind ?? mod;
    } catch {
      // Pagefind 未生成时返回空搜索对象
      return { search: async () => ({ results: [] }) };
    }
  })();

  return pagefindPromise;
}

export function usePagefind() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  // 递增请求序号：慢的旧查询返回时若已有更新的查询，丢弃过期结果
  const requestIdRef = useRef(0);

  const search = useCallback(async (query: string) => {
    const requestId = ++requestIdRef.current;

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const pf = await loadPagefind();
      const searchResults = await pf.search(query);

      const items = await Promise.all(
        searchResults.results.slice(0, 8).map(async (result) => {
          const data = await result.data();
          return {
            url: data.url || result.url,
            title: data.meta?.title || '',
            excerpt: data.excerpt || '',
            meta: {
              category: data.meta?.category,
            },
          };
        })
      );

      if (requestIdRef.current !== requestId) return;
      setResults(items);
    } catch {
      if (requestIdRef.current !== requestId) return;
      setResults([]);
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, []);

  return { results, loading, search };
}
