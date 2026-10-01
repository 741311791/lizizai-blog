/**
 * blog-data 纯函数工具（无网络/渲染依赖）
 *
 * 从 lib/blog-data.ts 拆出：resolvePodcastUrls 不依赖 markdown 渲染管线
 * （markdown.ts → beautiful-mermaid 为 ESM-only，CJS 测试链路无法加载），
 * 拆出后 lib/__tests__ 可直接 import 做真被测模块测试，不再复制实现。
 */

import type { PodcastItem } from '@/types/index';

// 读侧走自定义域（CDN）。注意：写侧（同步器生成的封面 URL）生产 workflow 显式
// 注入 r2.dev 免费子域，见 .github/workflows/feishu-sync.yml 与
// workers/feishu-blog-sync/src/cli.ts —— 统一到自定义域需同步改 workflow 并重写存量 meta
export const R2_BASE = process.env.R2_PUBLIC_URL || 'https://lizizai-blog.lihehua.xyz';

/**
 * 解析播客列表：将 contentTypes.podcast.items 中的文件名转为完整 R2 URL
 */
export function resolvePodcastUrls(
  categorySlug: string,
  articleSlug: string,
  items?: { name: string; slug: string; audioFile: string; coverFile?: string; scriptFile?: string; audioSize?: number }[],
): PodcastItem[] {
  if (!items || items.length === 0) return [];
  const base = `${R2_BASE}/blog-data/articles/${categorySlug}/${articleSlug}/podcast`;

  return items.map(item => ({
    name: item.name,
    slug: item.slug,
    audioFile: `${base}/${item.audioFile}`,
    coverFile: item.coverFile ? `${base}/${item.coverFile}` : undefined,
    scriptFile: item.scriptFile ? `${base}/${item.scriptFile}` : undefined,
    audioSize: item.audioSize,
  }));
}
