// ISR：与文章列表页同频（3600s），紧急更新走 /api/revalidate
export const revalidate = 3600;

/**
 * 多语言 Sitemap 生成
 * 为 en 和 zh 两种语言生成网站地图
 */

import { MetadataRoute } from 'next';
import { getAllArticles, getCategories, getAllTags } from '@/lib/blog-data';
import { siteConfig } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 静态页面路径
  const staticPaths = ['', '/about', '/archive', '/subscribe', '/privacy', '/terms', '/collection-notice'];
  const locales = ['en', 'zh'];

  // defaultLocale 为 zh：zh 无前缀，en 带 /en 前缀（与 i18n/routing.ts 保持一致）
  const localeUrl = (locale: string, path: string) =>
    locale === 'zh' ? `${baseUrl}${path}` : `${baseUrl}/en${path}`;

  // 静态页面 — 每种语言一个条目
  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: path === '' ? 'daily' as const : 'monthly' as const,
      priority: path === '' ? 1 : path === '/archive' ? 0.9 : 0.7,
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

  // 分类页面
  const categories = await getCategories();
  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((category) =>
    locales.map((locale) => ({
      url: localeUrl(locale, `/category/${category.slug}`),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  // 标签页面
  const tags = await getAllTags();
  const tagPages: MetadataRoute.Sitemap = tags.flatMap((tag) =>
    locales.map((locale) => ({
      url: localeUrl(locale, `/tag/${tag.slug}`),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // RSS Feeds — 全量 + contentType + category + 组合
  const feedPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/feed.xml`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${baseUrl}/feed/article.xml`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
    { url: `${baseUrl}/feed/podcast.xml`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
    ...categories.map((category) => ({
      url: `${baseUrl}/feed/category/${category.slug}.xml`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.4,
    })),
    // contentType + category 组合
    ...categories.flatMap((category) =>
      (['article', 'podcast'] as const).map((type) => ({
        url: `${baseUrl}/feed/${type}/${category.slug}.xml`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.3,
      }))
    ),
  ];

  return [...staticPages, ...articlePages, ...categoryPages, ...tagPages, ...feedPages];
}
