/**
 * Sitemap Generation
 * 动态生成网站地图，包含所有文章和分类页面
 */

import { MetadataRoute } from 'next';
import { getArticles, getCategories } from '@/lib/strapi';
import { siteConfig } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/archive`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/subscribe`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // 获取所有文章
  let articles: MetadataRoute.Sitemap = [];
  try {
    const articlesResponse = await getArticles({
      pageSize: 100, // 可根据实际情况调整
      sort: 'publishedAt:desc',
    });

    articles = (articlesResponse.data as any[]).map((article: any) => ({
      url: `${baseUrl}/article/${article.slug}`,
      lastModified: new Date(article.updatedAt || article.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch (error) {
    console.error('Failed to fetch articles for sitemap:', error);
  }

  // 获取所有分类
  let categories: MetadataRoute.Sitemap = [];
  try {
    const categoriesResponse = await getCategories();

    categories = (categoriesResponse.data as any[]).map((category: any) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Failed to fetch categories for sitemap:', error);
  }

  return [...staticPages, ...articles, ...categories];
}
