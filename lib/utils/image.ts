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
 * 检查图片 URL 是否为占位图
 *
 * @param imageUrl - 图片 URL
 * @returns 是否为占位图
 */
export function isPlaceholderImage(imageUrl: string): boolean {
  return imageUrl.includes('picsum.photos');
}
