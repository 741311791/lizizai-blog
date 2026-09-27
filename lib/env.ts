/**
 * 环境变量配置
 *
 * 精简版：移除所有 Strapi 相关配置
 */

export const config = {
  // 网站 URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://lizizai.xyz',

  // Resend 邮件 API

  // Cloudflare 服务端点
  emactionUrl: process.env.NEXT_PUBLIC_EMACTION_URL || '',
  webvisoUrl: process.env.NEXT_PUBLIC_WEBVISO_URL || '',
  cfCommentUrl: process.env.NEXT_PUBLIC_CF_COMMENT_URL || '',
  counterscaleUrl: process.env.NEXT_PUBLIC_COUNTERSCALE_URL || '',

  // 环境
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;
