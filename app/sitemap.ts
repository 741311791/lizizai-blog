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

  // 静态页面 — 每种语言一个条目
  const staticPages: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/zh${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' ? 'daily' as const : 'monthly' as const,
      priority: path === '' ? 1 : path === '/archive' ? 0.9 : 0.7,
    }))
  );

  // 文章页面
  const articles = await getAllArticles();
  const articlePages: MetadataRoute.Sitemap = articles.flatMap((article) =>
    locales.map((locale) => ({
      url: locale === 'en' ? `${baseUrl}/article/${article.slug}` : `${baseUrl}/zh/article/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))
  );

  // 分类页面
  const categories = await getCategories();
  const categoryPages: MetadataRoute.Sitemap = categories.flatMap((category) =>
    locales.map((locale) => ({
      url: locale === 'en' ? `${baseUrl}/category/${category.slug}` : `${baseUrl}/zh/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  // 标签页面
  const tags = await getAllTags();
  const tagPages: MetadataRoute.Sitemap = tags.flatMap((tag) =>
    locales.map((locale) => ({
      url: locale === 'en' ? `${baseUrl}/tag/${tag.slug}` : `${baseUrl}/zh/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  // RSS Feed
  const feedPage: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/feed.xml`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
  ];

  return [...staticPages, ...articlePages, ...categoryPages, ...tagPages, ...feedPage];
}
