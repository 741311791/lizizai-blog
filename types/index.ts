/**
 * 博客数据类型定义
 *
 * 前端显示类型，由 lib/content.ts 提供
 */

import type { Heading } from '@/lib/utils/heading';

/** 内容类型 */
export type ContentType = 'article' | 'podcast' | 'slides' | 'html';

/** 单个播客条目 */
export interface PodcastItem {
  name: string;
  slug: string;
  audioFile: string;
  coverFile?: string;
  scriptFile?: string;
  audioSize?: number;
}

/** 文章可用的内容类型描述（来自 R2 meta.json contentTypes 字段） */
export interface ContentTypes {
  article: true;
  podcast?: {
    items: PodcastItem[];
  };
  slides?: {
    slideCount: number;
    source: 'html_slides';
    hasScreenshots: boolean;
    manifest?: { file: string; label: string }[];
  };
  html?: {
    htmlUrl: string;
    fileSize?: number;
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
  /** 服务端预渲染的 HTML（lib/markdown.ts 产出），供 ArticleContent 直接渲染 */
  renderedContent?: string;
  /** 从 markdown 提取的标题目录（服务端 extractHeadings 产出），供 TOC 组件使用，避免原始 md 下传 client */
  headings?: Heading[];
  excerpt?: string;
  featuredImage?: string;
  thumbnailImage?: string; // WebP 缩略图（卡片列表等小图场景优先使用）
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
  // 播客列表（多播客支持，填充完整 R2 URL）
  podcasts?: PodcastItem[];
  slidesData?: SlideData[];
  slideCount?: number;
  // 新架构：多内容类型可用性描述
  contentTypes?: ContentTypes;
  // HTML 幻灯片基础 URL（前端拼接 iframe src）
  slidesBaseUrl?: string;
  // HTML 内容类型 URL（独立 HTML 文件）
  htmlUrl?: string;
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
