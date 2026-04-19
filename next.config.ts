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
      // 兼容旧数据中残留的 Worker 域名（重新同步后可移除）
      {
        protocol: 'https',
        hostname: 'feishu-blog-sync.lihehua.xyz',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.lizizai.xyz',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
