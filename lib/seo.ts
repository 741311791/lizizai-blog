/**
 * SEO Configuration and Utilities
 * 提供完整的 SEO metadata 支持
 */

import { Metadata } from 'next';

// 网站基础信息
export const siteConfig = {
  name: 'Zizai Blog',
  title: {
    zh: 'Zizai Blog - AI时代的个人成长与创业指南',
    en: 'Zizai Blog - Personal Growth & Startup Guide in the AI Era',
  },
  description: {
    zh: '帮助你在快速变化的世界中保持竞争力。探索AI、写作、营销策略，打造一人企业，设计理想生活方式。',
    en: 'Stay competitive in a rapidly changing world. Explore AI, writing, marketing strategies, build a one-person business, and design your ideal lifestyle.',
  },
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://lizizai.xyz',
  ogImage: '/og-image.png',
  twitterHandle: '@zizaiblog',
  author: {
    name: 'Zizai Li',
    url: 'https://lizizai.xyz/about',
  },
  keywords: {
    zh: [
      'AI工具',
      '个人成长',
      '一人企业',
      '写作技巧',
      '营销策略',
      '自动化',
      '创业指南',
      '在线业务',
    ],
    en: [
      'AI Tools',
      'Personal Growth',
      'Solo Business',
      'Writing',
      'Marketing',
      'Automation',
      'Startup Guide',
      'Online Business',
    ],
  },
};

/**
 * 生成默认 metadata（多语言支持）
 */
export function generateDefaultMetadata(locale: string = 'en'): Metadata {
  const lang = locale === 'zh' ? 'zh' : 'en';
  const title = siteConfig.title[lang];
  const description = siteConfig.description[lang];
  const keywords = siteConfig.keywords[lang];

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords,
    authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
    creator: siteConfig.author.name,
    publisher: siteConfig.name,

    // Open Graph
    openGraph: {
      type: 'website',
      locale: lang === 'zh' ? 'zh_CN' : 'en_US',
      url: siteConfig.url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: siteConfig.twitterHandle,
      images: [siteConfig.ogImage],
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Icons
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },

    // Manifest
    manifest: '/site.webmanifest',

    // RSS Feed + hreflang
    alternates: {
      types: {
        'application/rss+xml': `${siteConfig.url}/feed.xml`,
      },
      languages: {
        en: siteConfig.url,
        zh: `${siteConfig.url}/zh`,
      },
    },
  };
}

/**
 * 生成文章 metadata（支持多语言 hreflang）
 */
export function generateArticleMetadata({
  title,
  description,
  publishedAt,
  modifiedAt,
  author,
  category,
  tags,
  imageUrl,
  slug,
  locale = 'en',
}: {
  title: string;
  description?: string;
  publishedAt: string;
  modifiedAt?: string;
  author: string;
  category?: string;
  tags?: string[];
  imageUrl?: string;
  slug: string;
  locale?: string;
}): Metadata {
  const lang = locale === 'zh' ? 'zh' : 'en';
  const url = `${siteConfig.url}/article/${slug}`;
  const zhUrl = `${siteConfig.url}/zh/article/${slug}`;
  const ogImage = imageUrl || siteConfig.ogImage;

  return {
    title,
    description: description || siteConfig.description[lang],
    keywords: tags || siteConfig.keywords[lang],
    authors: [{ name: author }],

    // Open Graph
    openGraph: {
      type: 'article',
      locale: lang === 'zh' ? 'zh_CN' : 'en_US',
      url: lang === 'zh' ? zhUrl : url,
      title,
      description: description || siteConfig.description[lang],
      siteName: siteConfig.name,
      publishedTime: publishedAt,
      modifiedTime: modifiedAt || publishedAt,
      authors: [author],
      tags: tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || siteConfig.description[lang],
      creator: siteConfig.twitterHandle,
      images: [ogImage],
    },

    // hreflang alternate links
    alternates: {
      canonical: locale === 'zh' ? zhUrl : url,
      languages: {
        en: url,
        zh: zhUrl,
      },
    },
  };
}

/**
 * 生成分类页 metadata
 */
export function generateCategoryMetadata({
  name,
  description,
  slug,
}: {
  name: string;
  description?: string;
  slug: string;
}): Metadata {
  const url = `${siteConfig.url}/category/${slug}`;
  const title = `${name} - ${siteConfig.name}`;
  const desc = description || `浏览所有 ${name} 分类下的文章`;

  return {
    title,
    description: desc,

    // Open Graph
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url,
      title,
      description: desc,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      creator: siteConfig.twitterHandle,
      images: [siteConfig.ogImage],
    },

    // Alternate
    alternates: {
      canonical: url,
    },
  };
}

/**
 * 生成 JSON-LD 结构化数据
 */
export function generateArticleJsonLd({
  title,
  description,
  publishedAt,
  modifiedAt,
  author,
  imageUrl,
  slug,
}: {
  title: string;
  description?: string;
  publishedAt: string;
  modifiedAt?: string;
  author: string;
  imageUrl?: string;
  slug: string;
}) {
  const url = `${siteConfig.url}/article/${slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description || siteConfig.description.zh,
    image: imageUrl || siteConfig.ogImage,
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    author: {
      '@type': 'Person',
      name: author,
      url: siteConfig.author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * 生成网站 JSON-LD 结构化数据
 */
export function generateWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    description: siteConfig.description.zh,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
