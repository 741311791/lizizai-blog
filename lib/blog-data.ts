/**
 * 博客数据访问层（从 R2 读取）
 *
 * 替代原来的 lib/content.ts，从 Cloudflare R2 获取文章数据
 */

import type { Article, Category } from '@/types/index';
import { getLikes, getBatchViews } from '@/lib/services';
import { config } from '@/lib/env';

const R2_BASE = process.env.R2_PUBLIC_URL || 'https://lizizai-blog.lihehua.xyz';

/** 批量获取评论数 */
async function getBatchCommentCounts(slugs: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const url = config.cfCommentUrl;
  if (!url || slugs.length === 0) return map;

  const results = await Promise.allSettled(
    slugs.map(async (slug) => {
      const res = await fetch(`${url}/area/${slug}/comments`);
      if (!res.ok) return { slug, count: 0 };
      const data = await res.json();
      return { slug, count: (data as any[]).filter((c: any) => c.hidden !== 1).length };
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') map.set(r.value.slug, r.value.count);
  }
  return map;
}

/**
 * 获取所有文章
 */
export async function getAllArticles(): Promise<Article[]> {
  const res = await fetch(`${R2_BASE}/blog-data/articles.json`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error('Failed to fetch articles:', res.status);
    return [];
  }

  const data = await res.json();

  const articles: Article[] = data.map((item: any): Article => ({
    id: item.feishuDocToken || item.slug,
    title: item.title || '',
    subtitle: item.excerpt || undefined,
    slug: item.slug,
    content: '',
    excerpt: item.excerpt,
    featuredImage: undefined, // 封面图统一使用 picsum.photos，不从文章内容提取
    publishedAt: item.publishedAt,
    likes: 0,
    views: undefined,
    readingTime: item.readingTime,
    author: {
      name: '李自在',
      avatar: '/avator/avatar_default.png',
    },
    category: item.category || { name: '未分类', slug: 'uncategorized' },
    tags: item.tags || [],
  }));

  // 批量获取点赞、浏览和评论数据
  try {
    const ids = articles.map(a => a.id);
    const slugs = articles.map(a => a.slug);

    // 点赞逐个获取（emaction 无批量 API）
    const likesResults = await Promise.all(
      ids.map(async (id) => ({ id, likes: await getLikes(id) }))
    );

    // 浏览量批量获取（1 次请求替代 N 次）
    const viewsData = await getBatchViews(ids);
    const viewsMap = new Map(Object.entries(viewsData));

    // 评论数批量获取
    const commentsMap = await getBatchCommentCounts(slugs);

    // 用 Map 合并结果
    const likesMap = new Map(likesResults.map(r => [r.id, r.likes]));

    for (const article of articles) {
      article.likes = likesMap.get(article.id) || 0;
      article.views = viewsMap.get(article.id) || 0;
      article.commentsCount = commentsMap.get(article.slug) || 0;
    }
  } catch {
    // 获取动态数据失败不影响文章列表
  }

  return articles;
}

/**
 * 获取分类列表
 */
export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${R2_BASE}/blog-data/categories.json`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.map((c: any, index: number) => ({
    id: String(index + 1),
    name: c.name,
    slug: c.slug,
    description: c.description,
  }));
}

/**
 * 获取文章内容（Markdown）
 */
async function getArticleContent(categorySlug: string, articleSlug: string): Promise<string> {
  const res = await fetch(`${R2_BASE}/blog-data/articles/${categorySlug}/${articleSlug}/content.md`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return '';
  return res.text();
}

/**
 * 根据 slug 获取单篇文章（完整数据）
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getAllArticles();
  const article = articles.find(a => a.slug === slug);
  if (!article) return null;

  const content = await getArticleContent(article.category.slug, slug);

  return {
    ...article,
    content: content || '',
  };
}

/**
 * 按分类获取文章
 */
export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const articles = await getAllArticles();
  return articles.filter(a => a.category.slug === categorySlug);
}

/**
 * 获取相关文章（加权匹配：分类 + 标签 + 时效性）
 */
export async function getRelatedArticles(
  categorySlug: string,
  currentSlug: string,
  limit: number = 3
): Promise<Article[]> {
  const allArticles = await getAllArticles();
  const current = allArticles.find(a => a.slug === currentSlug);
  if (!current) return [];

  const now = Date.now();
  const scored = allArticles
    .filter(a => a.slug !== currentSlug)
    .map(article => {
      let score = 0;

      // 同分类 +3
      if (article.category?.slug === categorySlug) score += 3;

      // 每个共同标签 +2
      if (current.tags && article.tags) {
        const currentTagSlugs = new Set(current.tags.map(t => t.slug));
        for (const tag of article.tags) {
          if (currentTagSlugs.has(tag.slug)) score += 2;
        }
      }

      // 时效性：30 天内 +1，60 天内 +0.5
      const ageDays = (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays <= 30) score += 1;
      else if (ageDays <= 60) score += 0.5;

      return { article, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.article);

  return scored;
}

/**
 * 获取所有文章 slug（用于 generateStaticParams）
 */
export async function getAllArticleSlugs(): Promise<string[]> {
  const articles = await getAllArticles();
  return articles.map(a => a.slug);
}

/**
 * 获取所有分类 slug
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  const categories = await getCategories();
  return categories.map(c => c.slug);
}

/**
 * 获取所有标签（含文章数量）
 */
export async function getAllTags(): Promise<{ name: string; slug: string; count: number }[]> {
  const articles = await getAllArticles();
  const tagMap = new Map<string, { name: string; slug: string; count: number }>();

  for (const article of articles) {
    if (!article.tags) continue;
    for (const tag of article.tags) {
      const existing = tagMap.get(tag.slug);
      if (existing) {
        existing.count++;
      } else {
        tagMap.set(tag.slug, { name: tag.name, slug: tag.slug, count: 1 });
      }
    }
  }

  return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * 按标签获取文章
 */
export async function getArticlesByTag(tagSlug: string): Promise<Article[]> {
  const articles = await getAllArticles();
  return articles.filter(a => a.tags?.some(t => t.slug === tagSlug));
}

/**
 * 获取所有标签 slug（用于 generateStaticParams）
 */
export async function getAllTagSlugs(): Promise<string[]> {
  const tags = await getAllTags();
  return tags.map(t => t.slug);
}
