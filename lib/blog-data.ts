/**
 * 博客数据访问层（从 R2 读取）
 *
 * 替代原来的 lib/content.ts，从 Cloudflare R2 获取文章数据
 */

import { cache } from 'react';
import type { Article, Category, ContentTypes, SlideData, PodcastItem } from '@/types/index';
import { getLikes, getReactions, getViews, getBatchViews } from '@/lib/services';
import { config } from '@/lib/env';

const R2_BASE = process.env.R2_PUBLIC_URL || 'https://lizizai-blog.lihehua.xyz';
const isDev = process.env.NODE_ENV === 'development';

/** 获取单篇文章评论数 */
async function getCommentCount(slug: string): Promise<number> {
  const url = config.cfCommentUrl;
  if (!url) return 0;
  try {
    const res = await fetch(`${url}/area/${slug}/comments`);
    if (!res.ok) return 0;
    const data = await res.json();
    return (data as any[]).filter((c: any) => c.hidden !== 1).length;
  } catch {
    return 0;
  }
}

/**
 * 获取所有文章（同一请求内缓存，避免重复调用）
 */
export const getAllArticles = cache(async (): Promise<Article[]> => {
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
    featuredImage: item.coverImage || item.coverThumbnail || undefined,
    thumbnailImage: item.coverThumbnail || undefined,
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
    contentType: item.contentType || 'article',
    audioDuration: item.audioDuration,
    chapters: item.chapters,
    slideCount: item.slideCount,
    contentTypes: item.contentTypes as ContentTypes | undefined,
    slidesBaseUrl: item.contentTypes?.slides
      ? `${R2_BASE}/blog-data/articles/${item.category?.slug || 'uncategorized'}/${item.slug}/slides`
      : undefined,
  }));

  // 仅获取浏览量（1 次批量请求），开发模式跳过
  if (!isDev) {
    try {
      const ids = articles.map(a => a.id);
      const viewsData = await getBatchViews(ids);
      const viewsMap = new Map(Object.entries(viewsData));
      for (const article of articles) {
        article.views = viewsMap.get(article.id) || 0;
      }
    } catch {
      // 浏览量获取失败不影响文章列表
    }
  }

  return articles;
});

/**
 * 获取分类列表（同一请求内缓存）
 */
export const getCategories = cache(async (): Promise<Category[]> => {
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
});
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
 * 解析播客列表：将 contentTypes.podcast.items 中的文件名转为完整 R2 URL
 */
function resolvePodcastUrls(categorySlug: string, articleSlug: string, items?: { name: string; slug: string; audioFile: string; coverFile?: string; scriptFile?: string; audioSize?: number }[]): PodcastItem[] {
  if (!items || items.length === 0) return [];
  const base = `${R2_BASE}/blog-data/articles/${categorySlug}/${articleSlug}/podcast`;

  return items.map(item => ({
    name: item.name,
    slug: item.slug,
    audioFile: `${base}/${item.audioFile}`,
    coverFile: item.coverFile ? `${base}/${item.coverFile}` : undefined,
    scriptFile: item.scriptFile ? `${base}/${item.scriptFile}` : undefined,
    audioSize: item.audioSize,
  }));
}

/**
 * 获取幻灯片数据
 */
async function getSlidesData(categorySlug: string, articleSlug: string): Promise<SlideData[]> {
  const res = await fetch(`${R2_BASE}/blog-data/articles/${categorySlug}/${articleSlug}/slides.json`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * 根据 slug 获取单篇文章（完整数据）
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getAllArticles();
  const article = articles.find(a => a.slug === slug);
  if (!article) return null;

  const contentType = article.contentType || 'article';
  const categorySlug = article.category.slug;
  const ct = article.contentTypes;

  // 判断需要哪些额外数据获取（播客使用新列表格式，无需单独获取脚本）
  const needsSlidesJson = !ct?.slides && contentType === 'slides';

  // 并行获取所有需要的数据
  const [content, slidesData] = await Promise.all([
    getArticleContent(categorySlug, slug),
    needsSlidesJson ? getSlidesData(categorySlug, slug) : Promise.resolve([] as SlideData[]),
  ]);

  const result: Article = {
    ...article,
    content: content || '',
  };

  // 获取单篇文章的动态数据（likes/views/comments），开发模式跳过
  if (!isDev) {
    try {
      const [reactions, views, commentsCount] = await Promise.all([
        getReactions(result.id),
        getViews(result.id),
        getCommentCount(slug),
      ]);
      result.likes = reactions.reduce((sum, r) => sum + r.count, 0);
      result.views = views;
      result.commentsCount = commentsCount;
    } catch {
      // 动态数据获取失败不影响文章详情
    }
  }

  // 播客数据处理：解析播客列表，填充完整 R2 URL
  if (ct?.podcast?.items) {
    // 新格式：多播客列表
    result.podcasts = resolvePodcastUrls(categorySlug, slug, ct.podcast.items);
    // 兼容旧 AudioPlayer：首个播客的音频 URL
    if (result.podcasts.length > 0) {
      result.audioUrl = result.podcasts[0].audioFile;
    }
  } else if (ct?.podcast || contentType === 'podcast') {
    // 旧格式兼容：ct.podcast 存在但无 items（如 { audioFile, audioSize, hasScript }），
    // 或 contentType='podcast' 无 contentTypes 元数据
    // 旧同步代码固定以 audio.mp3 保存到 R2
    result.audioUrl = `${R2_BASE}/blog-data/articles/${categorySlug}/${slug}/podcast/audio.mp3`;
  }

  // 幻灯片数据处理
  if (ct?.slides) {
    result.slidesBaseUrl = `${R2_BASE}/blog-data/articles/${categorySlug}/${slug}/slides`;
    result.slideCount = ct.slides.slideCount;
  } else if (contentType === 'slides') {
    if (content.includes('\n---\n')) {
      const slides = content.split('\n---\n').filter(Boolean);
      result.slidesData = slides.map((md, index) => ({
        id: `slide-${index}`,
        index,
        markdown: md.trim(),
      }));
      result.slideCount = result.slidesData.length;
    } else {
      result.slidesData = slidesData as SlideData[];
      result.slideCount = (slidesData as SlideData[]).length;
    }
  }

  // HTML 内容类型：构造 R2 URL
  if (ct?.html) {
    result.htmlUrl = ct.html.htmlUrl.startsWith('http')
      ? ct.html.htmlUrl
      : `${R2_BASE}/blog-data/articles/${categorySlug}/${slug}/html/index.html`;
  } else if (contentType === 'html') {
    result.htmlUrl = `${R2_BASE}/blog-data/articles/${categorySlug}/${slug}/html/index.html`;
  }

  return result;
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
