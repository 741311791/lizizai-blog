/**
 * 环境变量配置
 *
 * 精简版：移除所有 Strapi 相关配置
 */

export const config = {
  // 网站 URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://lizizai.xyz',

  // Resend 邮件 API
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'Zizai Blog <noreply@lizizai.xyz>',

  // Cloudflare 服务端点
  emactionUrl: process.env.NEXT_PUBLIC_EMACTION_URL || '',
  webvisoUrl: process.env.NEXT_PUBLIC_WEBVISO_URL || '',
  cfCommentUrl: process.env.NEXT_PUBLIC_CF_COMMENT_URL || '',
  counterscaleUrl: process.env.NEXT_PUBLIC_COUNTERSCALE_URL || '',

  // Cloudflare D1（AI 资讯数据源）
  cfAccountId: process.env.CF_ACCOUNT_ID || '',
  cfD1DatabaseId: process.env.CF_D1_DATABASE_ID || '',
  cfD1ApiToken: process.env.CF_D1_API_TOKEN || '',

  // 环境
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;
