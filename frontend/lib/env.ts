/**
 * 环境变量验证和类型安全访问
 *
 * 使用 Zod 进行运行时验证，确保所有必需的环境变量都已正确配置
 */

import { z } from 'zod';

/**
 * 环境变量 schema 定义
 */
const envSchema = z.object({
  // Next.js 公开环境变量
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
    .describe('网站前端 URL'),

  NEXT_PUBLIC_STRAPI_URL: z
    .string()
    .url('NEXT_PUBLIC_STRAPI_URL must be a valid URL')
    .describe('Strapi 后端 URL'),

  NEXT_PUBLIC_STRAPI_API_URL: z
    .string()
    .url('NEXT_PUBLIC_STRAPI_API_URL must be a valid URL')
    .describe('Strapi API URL'),

  NEXT_PUBLIC_STRAPI_GRAPHQL_URL: z
    .string()
    .url('NEXT_PUBLIC_STRAPI_GRAPHQL_URL must be a valid URL')
    .optional()
    .describe('Strapi GraphQL URL'),

  // 服务器端环境变量
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),
});

/**
 * 环境变量类型
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 验证并导出环境变量
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
      NEXT_PUBLIC_STRAPI_API_URL: process.env.NEXT_PUBLIC_STRAPI_API_URL,
      NEXT_PUBLIC_STRAPI_GRAPHQL_URL: process.env.NEXT_PUBLIC_STRAPI_GRAPHQL_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('❌ 环境变量验证失败:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      console.error('\n请检查您的 .env 或 .env.local 文件，确保所有必需的环境变量都已正确配置。');
      console.error('参考 .env.example 文件查看所需的环境变量。\n');
      throw new Error('Invalid environment variables. Please check your .env file.');
    }
    throw error;
  }
}

/**
 * 验证后的环境变量（带类型）
 */
export const env = validateEnv();

/**
 * 类型安全的环境变量访问
 */
export const config = {
  // URLs
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  strapiUrl: env.NEXT_PUBLIC_STRAPI_URL,
  strapiApiUrl: env.NEXT_PUBLIC_STRAPI_API_URL,
  strapiGraphqlUrl: env.NEXT_PUBLIC_STRAPI_GRAPHQL_URL || `${env.NEXT_PUBLIC_STRAPI_URL}/graphql`,

  // Environment
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  nodeEnv: env.NODE_ENV,
} as const;

// 开发环境下显示配置信息
if (config.isDevelopment && typeof window !== 'undefined') {
  console.log('🔧 环境配置:', {
    siteUrl: config.siteUrl,
    strapiUrl: config.strapiUrl,
    strapiApiUrl: config.strapiApiUrl,
    environment: config.nodeEnv,
  });
}
