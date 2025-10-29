/**
 * Strapi 数据类型定义
 */

export interface StrapiImage {
  id: number;
  url: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: {
    thumbnail?: StrapiImageFormat;
    small?: StrapiImageFormat;
    medium?: StrapiImageFormat;
    large?: StrapiImageFormat;
  };
}

export interface StrapiImageFormat {
  url: string;
  width: number;
  height: number;
}

export interface StrapiAuthor {
  id: number;
  name: string;
  slug: string;
  bio?: string;
  avatar?: StrapiImage;
  email?: string;
  website?: string;
  twitter?: string;
  github?: string;
}

export interface StrapiCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export interface StrapiTag {
  id: number;
  name: string;
  slug: string;
}

export interface StrapiComment {
  id: number;
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  likes: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  article?: StrapiArticle;
  parentComment?: StrapiComment;
  replies?: StrapiComment[];
}

export interface StrapiArticle {
  id: number;
  title: string;
  slug: string;
  subtitle?: string;
  content: string;
  excerpt?: string;
  featuredImage?: StrapiImage;
  publishedAt: string;
  likes: number;
  views: number;
  readingTime?: number;
  createdAt: string;
  updatedAt: string;
  author?: StrapiAuthor;
  category?: StrapiCategory;
  tags?: StrapiTag[];
  comments?: StrapiComment[];
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: StrapiPagination;
  };
}

/**
 * 用于前端显示的简化类型
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
