/**
 * 内容数据访问层
 *
 * 从本地 MDX 文件和 YAML 配置读取博客内容，替代 Strapi API
 * 所有函数在服务端执行，返回值匹配 Article 接口
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import YAML from 'yaml';
import type { Article, Category, Author } from '@/types/index';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const ARTICLES_DIR = path.join(CONTENT_DIR, 'articles');

// ============= 缓存 =============

let articlesCache: Article[] | null = null;
let categoriesCache: Category[] | null = null;
let tagsCache: { name: string; slug: string }[] | null = null;
let authorsCache: Record<string, Author> | null = null;

function clearCache() {
  if (process.env.NODE_ENV === 'development') {
    articlesCache = null;
    categoriesCache = null;
    tagsCache = null;
    authorsCache = null;
  }
}

// ============= 工具函数 =============

/**
 * 从 markdown 内容计算阅读时间（分钟）
 */
function calculateReadingTime(content: string): number {
  // 中文：按字符数估算（每分钟约 400 字）
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  // 英文：按单词数估算（每分钟约 200 词）
  const englishWords = content.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(w => w.length > 0).length;

  const minutes = (chineseChars / 400) + (englishWords / 200);
  return Math.max(1, Math.ceil(minutes));
}

/**
 * 从 markdown 内容生成摘要
 */
function generateExcerpt(content: string, maxLength: number = 160): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\n/g, ' ')
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + '...';
}

// ============= 读取配置 =============

/**
 * 读取作者配置
 */
function loadAuthors(): Record<string, Author> {
  if (authorsCache) return authorsCache;

  const authorsDir = path.join(CONTENT_DIR, 'authors');
  const authors: Record<string, Author> = {};

  if (!fs.existsSync(authorsDir)) return authors;

  const files = fs.readdirSync(authorsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  for (const file of files) {
    const id = file.replace(/\.(yml|yaml)$/, '');
    const content = fs.readFileSync(path.join(authorsDir, file), 'utf-8');
    const data = YAML.parse(content) as Record<string, any>;
    authors[id] = {
      id,
      name: data.name || id,
      slug: id,
      bio: data.bio,
      avatar: data.avatar,
    };
  }

  authorsCache = authors;
  return authors;
}

/**
 * 读取分类配置
 */
function loadCategories(): Category[] {
  if (categoriesCache) return categoriesCache;

  const filePath = path.join(CONTENT_DIR, 'categories.yml');
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = YAML.parse(content) as { categories: Array<{ name: string; slug: string; description?: string }> };

  categoriesCache = (data.categories || []).map((cat, index) => ({
    id: String(index + 1),
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
  }));

  return categoriesCache!;
}

/**
 * 读取标签配置
 */
function loadTags(): { name: string; slug: string }[] {
  if (tagsCache) return tagsCache;

  const filePath = path.join(CONTENT_DIR, 'tags.yml');
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const data = YAML.parse(content) as { tags: Array<{ name: string; slug: string }> };

  tagsCache = data.tags || [];
  return tagsCache!;
}

// ============= 文章读取 =============

/**
 * 从文件系统读取所有文章
 */
function loadArticles(): Article[] {
  if (articlesCache) return articlesCache;

  if (!fs.existsSync(ARTICLES_DIR)) return [];

  const authors = loadAuthors();
  const categories = loadCategories();

  const slugs = fs.readdirSync(ARTICLES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const articles: Article[] = [];

  for (const slug of slugs) {
    const mdxPath = path.join(ARTICLES_DIR, slug, 'index.mdx');

    if (!fs.existsSync(mdxPath)) continue;

    try {
      const fileContent = fs.readFileSync(mdxPath, 'utf-8');
      const { data: frontmatter, content } = matter(fileContent);

      // 查找对应的分类
      const category = categories.find(c => c.slug === frontmatter.category) || {
        id: '0',
        name: 'Uncategorized',
        slug: 'uncategorized',
      };

      // 查找对应的作者
      const authorData = authors[frontmatter.author || 'zizai-li'] || {
        id: 'zizai-li',
        name: 'Zizai Li',
        slug: 'zizai-li',
      };

      // 处理封面图路径
      let featuredImage = frontmatter.coverImage || frontmatter.featuredImage;
      if (featuredImage && featuredImage.startsWith('./')) {
        featuredImage = `/images/articles/${slug}/${featuredImage.replace('./', '')}`;
      }

      // 处理标签
      const tags = Array.isArray(frontmatter.tags)
        ? frontmatter.tags.map((t: string) => {
            const tagData = loadTags().find(tag => tag.slug === t);
            return tagData || { name: t, slug: t };
          })
        : undefined;

      const article: Article = {
        id: slug,
        title: frontmatter.title || '',
        subtitle: frontmatter.subtitle,
        slug: frontmatter.slug || slug,
        content,
        excerpt: frontmatter.excerpt || generateExcerpt(content),
        featuredImage,
        publishedAt: frontmatter.date ? new Date(frontmatter.date).toISOString() : new Date().toISOString(),
        likes: 0, // 动态数据由 emaction 提供
        views: 0, // 动态数据由 Webviso 提供
        commentsCount: 0,
        readingTime: frontmatter.readingTime || calculateReadingTime(content),
        author: {
          name: authorData.name,
          avatar: authorData.avatar,
        },
        category: {
          name: category.name,
          slug: category.slug,
        },
        tags,
      };

      articles.push(article);
    } catch (error) {
      console.error(`Error loading article ${slug}:`, error);
    }
  }

  // 默认按发布日期降序排序
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  articlesCache = articles;
  return articles;
}

// ============= 公开 API =============

/**
 * 获取所有文章
 */
export function getAllArticles(options?: {
  sort?: 'date-asc' | 'date-desc';
  limit?: number;
  page?: number;
  pageSize?: number;
}): Article[] {
  clearCache();
  let articles = [...loadArticles()];

  if (options?.sort === 'date-asc') {
    articles.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  }

  if (options?.limit) {
    articles = articles.slice(0, options.limit);
  }

  if (options?.page && options?.pageSize) {
    const start = (options.page - 1) * options.pageSize;
    articles = articles.slice(start, start + options.pageSize);
  }

  return articles;
}

/**
 * 根据 slug 获取单篇文章
 */
export function getArticleBySlug(slug: string): Article | null {
  clearCache();
  const articles = loadArticles();
  return articles.find(a => a.slug === slug) || null;
}

/**
 * 按分类获取文章
 */
export function getArticlesByCategory(categorySlug: string): Article[] {
  clearCache();
  return loadArticles().filter(a => a.category.slug === categorySlug);
}

/**
 * 按标签获取文章
 */
export function getArticlesByTag(tagSlug: string): Article[] {
  clearCache();
  return loadArticles().filter(a => a.tags?.some(t => t.slug === tagSlug));
}

/**
 * 获取相关文章（同分类，排除当前）
 */
export function getRelatedArticles(categorySlug: string, currentSlug: string, limit: number = 3): Article[] {
  clearCache();
  return loadArticles()
    .filter(a => a.category.slug === categorySlug && a.slug !== currentSlug)
    .slice(0, limit);
}

/**
 * 获取所有分类
 */
export function getCategories(): Category[] {
  return loadCategories();
}

/**
 * 根据 slug 获取分类
 */
export function getCategoryBySlug(slug: string): Category | null {
  return loadCategories().find(c => c.slug === slug) || null;
}

/**
 * 获取所有标签
 */
export function getTags(): { name: string; slug: string }[] {
  return loadTags();
}

/**
 * 根据 slug 获取标签
 */
export function getTagBySlug(slug: string): { name: string; slug: string } | null {
  return loadTags().find(t => t.slug === slug) || null;
}

/**
 * 获取作者
 */
export function getAuthor(id: string): Author | null {
  return loadAuthors()[id] || null;
}

/**
 * 获取所有作者
 */
export function getAuthors(): Author[] {
  return Object.values(loadAuthors());
}

/**
 * 搜索文章
 */
export function searchArticles(query: string): Article[] {
  clearCache();
  const lowerQuery = query.toLowerCase();
  return loadArticles().filter(a =>
    a.title.toLowerCase().includes(lowerQuery) ||
    a.subtitle?.toLowerCase().includes(lowerQuery) ||
    a.excerpt?.toLowerCase().includes(lowerQuery) ||
    a.content.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 获取文章总数
 */
export function getArticleCount(): number {
  return loadArticles().length;
}

/**
 * 获取所有文章 slug（用于 generateStaticParams）
 */
export function getAllArticleSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs.readdirSync(ARTICLES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .filter(dirent => fs.existsSync(path.join(ARTICLES_DIR, dirent.name, 'index.mdx')))
    .map(dirent => dirent.name);
}

/**
 * 获取所有分类 slug（用于 generateStaticParams）
 */
export function getAllCategorySlugs(): string[] {
  return loadCategories().map(c => c.slug);
}
