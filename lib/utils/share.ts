/**
 * 分享工具函数
 *
 * 提供跨平台的分享功能，优先使用原生 Web Share API，降级到复制链接
 */

export interface ShareData {
  title: string;
  text?: string;
  url: string;
}

/**
 * 检查是否支持 Web Share API
 */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * 分享内容（优先使用原生分享）
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  // 优先使用 Web Share API（移动设备）
  if (canShare()) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return true;
    } catch (error: any) {
      // 用户取消分享
      if (error.name === 'AbortError') {
        return false;
      }
      console.error('Share failed:', error);
    }
  }

  // 降级：复制到剪贴板
  return copyToClipboard(data.url);
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
}

/**
 * 社交媒体分享 URL 生成器
 */
export const socialShare = {
  twitter: (url: string, text: string) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,

  facebook: (url: string) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,

  linkedin: (url: string, title: string) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,

  email: (url: string, subject: string, body: string) =>
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\n' + url)}`,

  reddit: (url: string, title: string) =>
    `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,

  hackernews: (url: string, title: string) =>
    `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`,
};
