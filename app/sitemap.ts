// ISR：与文章列表页同频（3600s），紧急更新走 /api/revalidate
export const revalidate = 3600;

/**
 * 多语言 Sitemap 生成
 * 为 en 和 zh 两种语言生成网站地图
 *
 * lastModified 原则：内容页（分类/标签/feed）取其下文章 max(publishedAt)，
 * 不用 new Date() 硬编码——"永远最新"会稀释搜索引擎对 lastModified 信号的信任。
 */

import { MetadataRoute } from 'next';
import { getAllArticles, getCategories, getAllTags } from '@/lib/blog-data';
import { siteConfig } from '@/lib/seo';

/** 取文章集合的最新发布时间；空集合回退当前时间（页面本身仍随发版更新） */
function latestModified(articles: { publishedAt: string }[]): Date {
  if (articles.length === 0) return new Date();
  return new Date(Math.max(...articles.map((a) => new Date(a.publishedAt).getTime() || 0)));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 静态页面路径（/daily-news 与 /resume 此前遗漏，2026-10-20 补入）
  const staticPaths = ['', '/about', '/archive', '/daily-news', '/subscribe', '/resume', '/privacy', '/terms', '/collection-notice'];
  const locales = ['en', 'zh'];

  // defaultLocale 为 zh：zh 无前缀，en 带 /en 前缀（与 i18n/routing.ts 保持一致）
  const localeUrl = (locale: string, path: string) =>
    locale === 'zh' ? `${baseUrl}${path}` : `${baseUrl}/en${path}`;

  // 静态页面 — 每种语言一个条目
  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: path === '' || path === '/daily-news' ? 'daily' as const : 'monthly' as const,
      priority: path === '' ? 1 : path === '/archive' || path === '/daily-news' ? 0.9 : path === '/resume' ? 0.5 : 0.7,
    }))
  );

  // 文章页面
  const articles = await getAllArticles();
  const articlePages: MetadataRoute.Sitemap = articles.flatMap((article) =>
    locales.map((locale) => ({
      url: localeUrl(locale, `/article/${article.slug}`),
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))
  );

  // 分类页面 — lastModified 取该分类下文章的最新发布时间
  const categories = await getCategories();
  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((category) => {
    const lastModified = latestModified(
      articles.filter((a) => a.category?.slug === category.slug)
    );
    return locales.map((locale) => ({
      url: localeUrl(locale, `/category/${category.slug}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  });

  // 标签页面 — lastModified 取带该标签文章的最新发布时间
  const tags = await getAllTags();
  const tagPages: MetadataRoute.Sitemap = tags.flatMap((tag) => {
    const lastModified = latestModified(
      articles.filter((a) => a.tags?.some((t) => t.slug === tag.slug))
    );
    return locales.map((locale) => ({
      url: localeUrl(locale, `/tag/${tag.slug}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  });

  // feed 内容均由文章驱动：统一取全量文章最新发布时间
  const latestArticleAt = latestModified(articles);

  // RSS Feeds — 全量 + contentType + category + 组合
  const feedPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/feed.xml`, lastModified: latestArticleAt, changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/feed/article.xml`, lastModified: latestArticleAt, changeFrequency: 'daily', priority: 0.5 },
    { url: `${baseUrl}/feed/podcast.xml`, lastModified: latestArticleAt, changeFrequency: 'daily', priority: 0.5 },
    ...categories.map((category) => ({
      url: `${baseUrl}/feed/category/${category.slug}.xml`,
      lastModified: latestArticleAt,
      changeFrequency: 'daily' as const,
      priority: 0.4,
    })),
    // contentType + category 组合
    ...categories.flatMap((category) =>
      (['article', 'podcast'] as const).map((type) => ({
        url: `${baseUrl}/feed/${type}/${category.slug}.xml`,
        lastModified: latestArticleAt,
        changeFrequency: 'daily' as const,
        priority: 0.3,
      }))
    ),
  ];

  return [...staticPages, ...articlePages, ...categoryPages, ...tagPages, ...feedPages];
}
