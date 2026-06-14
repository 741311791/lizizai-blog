import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      // R2 CDN（文章封面图和内容图片）
      {
        protocol: 'https',
        hostname: 'pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev',
        pathname: '/**',
      },
      // Worker 同步域名（兼容旧数据中残留的图片 URL）
      {
        protocol: 'https',
        hostname: 'feishu-blog-sync.lihehua.xyz',
        pathname: '/**',
      },
      // R2 自定义域名（已在 Cloudflare Dashboard 修复）
      {
        protocol: 'https',
        hostname: 'lizizai-blog.lihehua.xyz',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
