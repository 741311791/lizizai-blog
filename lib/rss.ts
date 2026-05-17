import type { Article, ContentType } from '@/types/index';
import { siteConfig } from '@/lib/seo';

/** 支持 feed 输出的内容类型 */
export const FEED_CONTENT_TYPES: readonly ContentType[] = ['article', 'podcast'] as const;

/** 启用分类级 feed 的 category slug */
export const FEED_ENABLED_CATEGORIES = ['daily-news', 'ai', 'human-3-0'] as const;

/** Feed 生成选项 */
interface FeedOptions {
  title: string;
  description: string;
  feedPath: string;
  language?: string;
  articles: Article[];
  limit?: number;
}

/** 获取文章的内容类型，默认为 article */
export function getContentType(article: Article): ContentType {
  return article.contentType || 'article';
}

/** 判断文章是否匹配指定内容类型（兼容新旧架构） */
export function matchesContentType(article: Article, type: ContentType): boolean {
  const ct = article.contentTypes;
  if (type === 'podcast') {
    return ct ? !!ct.podcast : article.contentType === 'podcast';
  }
  return ct ? !!ct.article : getContentType(article) === 'article';
}

function escapeXmlCDATA(str: string): string {
  return str.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

export function generateRSSXml(options: FeedOptions): string {
  const {
    title,
    description,
    feedPath,
    language = 'zh-CN',
    articles,
    limit = 20,
  } = options;

  const items = articles.slice(0, limit);
  const selfUrl = `${siteConfig.url}${feedPath}`;

  const rssItems = items
    .map((article) => {
      const link = `${siteConfig.url}/article/${article.slug}`;
      const desc = article.subtitle || article.excerpt || '';
      return `
    <item>
      <title><![CDATA[${escapeXmlCDATA(article.title)}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${escapeXmlCDATA(desc)}]]></description>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      ${article.category ? `<category><![CDATA[${escapeXmlCDATA(article.category.name)}]]></category>` : ''}
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${escapeXmlCDATA(title)}]]></title>
    <description><![CDATA[${escapeXmlCDATA(description)}]]></description>
    <link>${siteConfig.url}</link>
    <language>${language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;
}

export function rssResponse(xml: string): Response {
  return new Response(xml.trim(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
