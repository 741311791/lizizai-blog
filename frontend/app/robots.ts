/**
 * Robots.txt Generation
 * 配置搜索引擎爬虫行为
 */

import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
        crawlDelay: 0,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
