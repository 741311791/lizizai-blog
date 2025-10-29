/**
 * 数据转换工具
 * 
 * 将 Strapi 数据格式转换为前端使用的格式
 */

import { StrapiArticle, StrapiComment, Article, Comment } from '@/types/strapi';
import { getStrapiMedia } from './strapi';

/**
 * 转换 Strapi 文章数据为前端格式
 */
export function transformArticle(strapiArticle: StrapiArticle): Article {
  return {
    id: strapiArticle.id.toString(),
    title: strapiArticle.title,
    subtitle: strapiArticle.subtitle,
    slug: strapiArticle.slug,
    content: strapiArticle.content,
    excerpt: strapiArticle.excerpt,
    featuredImage: strapiArticle.featuredImage?.url 
      ? getStrapiMedia(strapiArticle.featuredImage.url)
      : undefined,
    publishedAt: strapiArticle.publishedAt,
    likes: strapiArticle.likes || 0,
    views: strapiArticle.views || 0,
    commentsCount: strapiArticle.comments?.length || 0,
    readingTime: strapiArticle.readingTime,
    author: {
      name: strapiArticle.author?.name || 'Anonymous',
      avatar: strapiArticle.author?.avatar?.url 
        ? getStrapiMedia(strapiArticle.author.avatar.url)
        : undefined,
    },
    category: {
      name: strapiArticle.category?.name || 'Uncategorized',
      slug: strapiArticle.category?.slug || 'uncategorized',
    },
    tags: strapiArticle.tags?.map(tag => ({
      name: tag.name,
      slug: tag.slug,
    })),
  };
}

/**
 * 转换 Strapi 评论数据为前端格式
 */
export function transformComment(strapiComment: StrapiComment): Comment {
  return {
    id: strapiComment.id.toString(),
    author: {
      name: strapiComment.authorName,
      avatar: strapiComment.authorAvatar,
    },
    content: strapiComment.content,
    createdAt: strapiComment.createdAt,
    likes: strapiComment.likes || 0,
    replies: strapiComment.replies?.map(transformComment),
  };
}

/**
 * 批量转换文章数据
 */
export function transformArticles(strapiArticles: StrapiArticle[]): Article[] {
  return strapiArticles.map(transformArticle);
}

/**
 * 批量转换评论数据
 */
export function transformComments(strapiComments: StrapiComment[]): Comment[] {
  return strapiComments.map(transformComment);
}

/**
 * 计算阅读时长（基于内容长度）
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

/**
 * 生成文章摘要
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  // 移除 Markdown 语法
  const plainText = content
    .replace(/#{1,6}\s/g, '') // 移除标题符号
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
    .replace(/`(.+?)`/g, '$1') // 移除代码
    .replace(/\n/g, ' ') // 移除换行
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + '...';
}
