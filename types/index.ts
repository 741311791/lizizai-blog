/**
 * 博客数据类型定义
 *
 * 前端显示类型，由 lib/content.ts 提供
 */

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt: string;
  likes: number;
  views?: number;
  commentsCount?: number;
  sharesCount?: number;
  readingTime?: number;
  author: {
    name: string;
    avatar?: string;
  };
  category: {
    name: string;
    slug: string;
  };
  tags?: {
    name: string;
    slug: string;
  }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

// ============= AI 资讯 =============

/** AI 资讯条目（对应 D1 ai_news 表） */
export interface AiNews {
  id: number;
  date: string;
  title: string;
  summary: string;
  coverUrl: string;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  importance: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** AI 资讯查询结果 */
export interface AiNewsResult {
  items: AiNews[];
  date: string | null;
  isFallback: boolean;
  isEmpty: boolean;
  isError: boolean;
}

/** AI 资讯列表 API 响应 */
export interface AiNewsListResponse {
  ok: boolean;
  data: {
    date: string;
    items: AiNews[];
    total: number;
    has_more: boolean;
  };
}

/** AI 资讯日期列表 API 响应 */
export interface AiNewsDatesResponse {
  ok: boolean;
  data: {
    dates: string[];
  };
}
