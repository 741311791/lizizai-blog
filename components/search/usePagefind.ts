'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

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

  pagefindPromise = new Promise((resolve) => {
    if (typeof window !== 'undefined') {
      // Pagefind 由构建后的 postbuild 脚本生成
      const script = document.createElement('script');
      script.src = '/pagefind/pagefind.js';
      script.onload = () => {
        resolve((window as any).pagefind as PagefindInstance);
      };
      script.onerror = () => {
        // Pagefind 未生成时返回空搜索对象
        resolve({
          search: async () => ({ results: [] }),
        });
      };
      document.head.appendChild(script);
    }
  });

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
