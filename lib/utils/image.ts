/**
 * 图片处理工具函数
 */

/** 品牌默认封面（无封面文章的卡片占位图，与 /api/og 动态卡同版式） */
export const DEFAULT_COVER = '/covers/default-cover.png';

/**
 * 获取文章封面图片 URL
 * 如果文章没有封面图，返回品牌默认封面
 */
export function getArticleImageUrl(featuredImage: string | undefined): string {
  return featuredImage || DEFAULT_COVER;
}

/**
 * 获取卡片场景的封面图片 URL
 * 优先使用 WebP 缩略图（体积更小），无缩略图时回退到全尺寸图
 */
export function getCardImageUrl(
  thumbnailImage: string | undefined,
  featuredImage: string | undefined
): string {
  return thumbnailImage || getArticleImageUrl(featuredImage);
}

/**
 * 检查图片是否来自 R2 CDN（已通过 CDN 分发，无需 Next.js 再次优化）
 *
 * R2 CDN 图片直接由 Cloudflare 边缘节点分发，经 Next.js /_next/image 代理
 * 反而会增加下载延迟，导致超时（7s）返回 500。
 * 本地默认封面（public/）不受影响，正常走优化。
 */
export function isR2CdnImage(imageUrl: string): boolean {
  return imageUrl.includes('.r2.dev') || imageUrl.includes('lihehua.xyz');
}

/**
 * 判断图片是否应跳过 Next.js 优化（R2 CDN 图）
 */
export function shouldSkipImageOptimization(imageUrl: string): boolean {
  return isR2CdnImage(imageUrl);
}
