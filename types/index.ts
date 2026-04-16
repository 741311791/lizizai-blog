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
