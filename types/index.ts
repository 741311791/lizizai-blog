/**
 * 博客数据类型定义
 *
 * 前端显示类型，由 lib/content.ts 提供
 */

/** 内容类型 */
export type ContentType = 'article' | 'podcast' | 'slides';

/** 文章可用的内容类型描述（来自 R2 meta.json contentTypes 字段） */
export interface ContentTypes {
  article: true;
  podcast?: {
    audioFile: string;
    audioSize: number;
    hasScript: boolean;
    chapters?: Chapter[];
    audioDuration?: number;
  };
  slides?: {
    slideCount: number;
    source: 'html_slides';
    hasScreenshots: boolean;
    manifest?: { file: string; label: string }[];
  };
}

/** 播客章节 */
export interface Chapter {
  id: string;
  title: string;
  startTime: number; // 秒
}

/** 幻灯片数据 */
export interface SlideData {
  id: string;
  index: number;
  markdown: string;
  notes?: string;
}

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
  // 多内容类型扩展字段（全部可选，默认 article）
  contentType?: ContentType;
  audioUrl?: string;
  audioDuration?: number;
  chapters?: Chapter[];
  scriptContent?: string;
  slidesData?: SlideData[];
  slideCount?: number;
  // 新架构：多内容类型可用性描述
  contentTypes?: ContentTypes;
  // HTML 幻灯片基础 URL（前端拼接 iframe src）
  slidesBaseUrl?: string;
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
