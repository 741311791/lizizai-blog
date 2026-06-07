/**
 * 图片处理工具函数
 */

/**
 * 生成基于文章 ID 的占位图 URL
 * 使用 picsum.photos 提供稳定的占位图
 *
 * @param articleId - 文章 ID，用于生成一致的图片
 * @param width - 图片宽度，默认 800
 * @param height - 图片高度，默认 600
 * @returns picsum.photos URL
 */
export function generatePlaceholderImage(
  articleId: string,
  width: number = 800,
  height: number = 600
): string {
  // 使用文章 ID 作为 seed，确保同一篇文章总是显示相同的占位图
  return `https://picsum.photos/seed/${articleId}/800/600`;
}

/**
 * 获取文章封面图片 URL
 * 如果文章没有封面图，返回占位图
 *
 * @param featuredImage - 文章封面图 URL（可选）
 * @param articleId - 文章 ID
 * @returns 图片 URL
 */
export function getArticleImageUrl(
  featuredImage: string | undefined,
  articleId: string
): string {
  return featuredImage || generatePlaceholderImage(articleId);
}

/**
 * 获取卡片场景的封面图片 URL
 * 优先使用 WebP 缩略图（体积更小），无缩略图时回退到全尺寸图
 *
 * @param thumbnailImage - WebP 缩略图 URL（可选）
 * @param featuredImage - 全尺寸封面图 URL（可选）
 * @param articleId - 文章 ID
 * @returns 图片 URL
 */
export function getCardImageUrl(
  thumbnailImage: string | undefined,
  featuredImage: string | undefined,
  articleId: string
): string {
  return thumbnailImage || getArticleImageUrl(featuredImage, articleId);
}

/**
 * 检查图片 URL 是否为占位图
 *
 * @param imageUrl - 图片 URL
 * @returns 是否为占位图
 */
export function isPlaceholderImage(imageUrl: string): boolean {
  return imageUrl.includes('picsum.photos');
}

/**
 * 检查图片是否来自 R2 CDN（已通过 CDN 分发，无需 Next.js 再次优化）
 *
 * R2 CDN 图片直接由 Cloudflare 边缘节点分发，经 Next.js /_next/image 代理
 * 反而会增加下载延迟，导致超时（7s）返回 500。
 *
 * @param imageUrl - 图片 URL
 * @returns 是否为 R2 CDN 图片
 */
export function isR2CdnImage(imageUrl: string): boolean {
  return imageUrl.includes('.r2.dev') || imageUrl.includes('lihehua.xyz');
}

/**
 * 判断图片是否应跳过 Next.js 优化（R2 CDN 或占位图）
 *
 * @param imageUrl - 图片 URL
 * @returns 是否应跳过优化
 */
export function shouldSkipImageOptimization(imageUrl: string): boolean {
  return isR2CdnImage(imageUrl) || isPlaceholderImage(imageUrl);
}
