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
    // 启用 AVIF（优先）+ WebP（兜底）图片优化，提升首屏图片加载性能
    formats: ['image/avif', 'image/webp'],
  },
  // 隐藏 X-Powered-By 响应头（安全卫生项）
  poweredByHeader: false,
  // 优化 barrel imports：让 webpack 对 lucide-react/date-fns 按需打包，
  // 避免整个 barrel 文件进入构建 trace（vercel-react-best-practices: bundle-barrel-imports）
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default withNextIntl(nextConfig);
