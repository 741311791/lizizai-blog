import { getAllArticles } from '@/lib/blog-data';
import { siteConfig } from '@/lib/seo';

export async function GET() {
  const articles = await getAllArticles();
  const latestArticles = articles.slice(0, 20);

  const rssItems = latestArticles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteConfig.url}/article/${article.slug}</link>
      <guid isPermaLink="true">${siteConfig.url}/article/${article.slug}</guid>
      <description><![CDATA[${article.subtitle || article.excerpt || ''}]]></description>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      ${article.category ? `<category>${article.category.name}</category>` : ''}
    </item>`
    )
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name}</title>
    <description>${siteConfig.description}</description>
    <link>${siteConfig.url}</link>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteConfig.url}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
