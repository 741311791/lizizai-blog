/**
 * 环境变量验证工具
 *
 * 使用方法:
 * 1. 复制此文件为 env-validator.ts
 * 2. 在 backend/src/index.ts 中导入并调用 validateEnv()
 * 3. 确保安装了 zod: pnpm add zod
 *
 * 安全原则:
 * - 启动时验证所有必需的环境变量
 * - 验证密钥强度和格式
 * - 生产环境强制使用强密钥
 */

import { z } from 'zod';

/**
 * 环境变量 Schema 定义
 */
const envSchema = z.object({
  // ========== 安全密钥（必需）==========
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, '❌ ADMIN_JWT_SECRET 必须至少 32 字符（当前密钥过弱）')
    .describe('管理员 JWT 密钥'),

  JWT_SECRET: z
    .string()
    .min(32, '❌ JWT_SECRET 必须至少 32 字符（当前密钥过弱）')
    .describe('用户 JWT 密钥'),

  API_TOKEN_SALT: z
    .string()
    .min(16, '❌ API_TOKEN_SALT 必须至少 16 字符')
    .describe('API Token 盐值'),

  TRANSFER_TOKEN_SALT: z
    .string()
    .min(16, '❌ TRANSFER_TOKEN_SALT 必须至少 16 字符')
    .describe('传输 Token 盐值'),

  ENCRYPTION_KEY: z
    .string()
    .length(64, '❌ ENCRYPTION_KEY 必须是 64 位十六进制字符串')
    .regex(/^[0-9a-f]{64}$/i, '❌ ENCRYPTION_KEY 格式不正确（应为十六进制）')
    .describe('数据加密密钥'),

  APP_KEYS: z
    .string()
    .refine(
      (keys) => {
        const keyArray = keys.split(',');
        return keyArray.length >= 2 && keyArray.every(k => k.trim().length >= 16);
      },
      '❌ APP_KEYS 必须包含至少 2 个密钥，每个至少 16 字符'
    )
    .describe('应用密钥数组'),

  // ========== 数据库配置 ==========
  DATABASE_CLIENT: z
    .enum(['sqlite', 'postgres', 'mysql'])
    .default('sqlite')
    .describe('数据库类型'),

  DATABASE_URL: z
    .string()
    .url('❌ DATABASE_URL 必须是有效的 URL')
    .optional()
    .refine(
      (url) => {
        if (process.env.NODE_ENV === 'production' && process.env.DATABASE_CLIENT === 'postgres') {
          return !!url;
        }
        return true;
      },
      '❌ 生产环境使用 PostgreSQL 时必须提供 DATABASE_URL'
    )
    .describe('数据库连接 URL'),

  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true')
    .refine(
      (ssl) => {
        if (process.env.NODE_ENV === 'production') {
          return ssl === true;
        }
        return true;
      },
      '❌ 生产环境必须启用 DATABASE_SSL=true'
    )
    .describe('数据库 SSL 连接'),

  // ========== API 密钥 ==========
  RESEND_API_KEY: z
    .string()
    .regex(
      /^re_[a-zA-Z0-9_]+$/,
      '❌ RESEND_API_KEY 格式不正确（应以 re_ 开头）'
    )
    .optional()
    .refine(
      (key) => {
        if (process.env.NODE_ENV === 'production') {
          return !!key && key !== 'your-api-key-here';
        }
        return true;
      },
      '❌ 生产环境必须配置有效的 RESEND_API_KEY'
    )
    .describe('Resend 邮件服务 API 密钥'),

  EMAIL_FROM: z
    .string()
    .email('❌ EMAIL_FROM 必须是有效的邮箱地址')
    .or(
      z.string().regex(
        /^.+<[^@]+@[^@]+\.[^@]+>$/,
        '❌ EMAIL_FROM 格式应为: Name <email@domain.com>'
      )
    )
    .optional()
    .describe('发件人邮箱'),

  // ========== URLs ==========
  FRONTEND_URL: z
    .string()
    .url('❌ FRONTEND_URL 必须是有效的 URL')
    .refine(
      (url) => {
        if (process.env.NODE_ENV === 'production') {
          return url.startsWith('https://');
        }
        return true;
      },
      '❌ 生产环境 FRONTEND_URL 必须使用 HTTPS'
    )
    .describe('前端应用 URL'),

  // ========== CORS 配置 ==========
  CORS_ORIGINS: z
    .string()
    .optional()
    .refine(
      (origins) => {
        if (!origins) return true;
        const originList = origins.split(',').map(o => o.trim());
        return originList.every(origin => {
          try {
            new URL(origin);
            return true;
          } catch {
            return false;
          }
        });
      },
      '❌ CORS_ORIGINS 包含无效的 URL'
    )
    .describe('允许的 CORS 源'),

  // ========== 环境 ==========
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('运行环境'),

  HOST: z
    .string()
    .default('0.0.0.0')
    .describe('服务器监听地址'),

  PORT: z
    .string()
    .regex(/^\d+$/, '❌ PORT 必须是数字')
    .transform(Number)
    .refine((port) => port > 0 && port < 65536, '❌ PORT 必须在 1-65535 之间')
    .default('1337')
    .describe('服务器端口'),
});

/**
 * 环境变量类型
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 验证环境变量
 *
 * @returns 验证后的环境变量
 * @throws 如果验证失败，进程将退出
 */
export function validateEnv(): Env {
  console.log('\n🔍 验证环境变量...\n');

  try {
    const env = envSchema.parse(process.env);

    // 打印验证成功信息
    console.log('✅ 环境变量验证通过\n');

    // 开发环境显示配置信息
    if (env.NODE_ENV === 'development') {
      console.log('📋 当前配置:');
      console.log(`   - 环境: ${env.NODE_ENV}`);
      console.log(`   - 数据库: ${env.DATABASE_CLIENT}`);
      console.log(`   - SSL: ${env.DATABASE_SSL}`);
      console.log(`   - 前端 URL: ${env.FRONTEND_URL}`);
      console.log('');
    }

    // 生产环境安全检查
    if (env.NODE_ENV === 'production') {
      performSecurityChecks(env);
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 环境变量验证失败:\n');

      error.issues.forEach((issue, index) => {
        console.error(`   ${index + 1}. ${issue.message}`);
        if (issue.path.length > 0) {
          console.error(`      变量: ${issue.path.join('.')}`);
        }
      });

      console.error('\n💡 修复建议:');
      console.error('   1. 检查 .env 或 .env.local 文件');
      console.error('   2. 参考 .env.example 查看所需的环境变量');
      console.error('   3. 运行 npm run generate:secrets 生成安全密钥\n');

      process.exit(1);
    }

    throw error;
  }
}

/**
 * 生产环境安全检查
 */
function performSecurityChecks(env: Env): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 检查密钥是否为示例值
  const exampleKeys = [
    'GENERATE_RANDOM_KEY',
    'your-secret-here',
    'changeme',
    'example',
  ];

  const checkKey = (key: string, value: string | undefined) => {
    if (!value) return;

    const lowerValue = value.toLowerCase();
    if (exampleKeys.some(example => lowerValue.includes(example))) {
      errors.push(`❌ ${key} 使用了示例值，请生成真实密钥`);
    }
  };

  checkKey('ADMIN_JWT_SECRET', process.env.ADMIN_JWT_SECRET);
  checkKey('JWT_SECRET', process.env.JWT_SECRET);
  checkKey('ENCRYPTION_KEY', process.env.ENCRYPTION_KEY);

  // 检查 CORS 配置
  const corsOrigins = env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [];
  if (corsOrigins.some(origin => origin.includes('*'))) {
    warnings.push('⚠️  CORS_ORIGINS 包含通配符，可能存在安全风险');
  }

  // 检查 URL 是否使用 HTTPS
  if (env.FRONTEND_URL && !env.FRONTEND_URL.startsWith('https://')) {
    warnings.push('⚠️  FRONTEND_URL 未使用 HTTPS');
  }

  // 输出警告和错误
  if (warnings.length > 0) {
    console.warn('\n⚠️  生产环境安全警告:');
    warnings.forEach(warning => console.warn(`   ${warning}`));
    console.warn('');
  }

  if (errors.length > 0) {
    console.error('\n🚨 生产环境安全错误:');
    errors.forEach(error => console.error(`   ${error}`));
    console.error('\n请修复以上错误后重新启动应用\n');
    process.exit(1);
  }
}

/**
 * 获取类型安全的环境变量
 */
export const env = validateEnv();

/**
 * 导出便捷访问函数
 */
export const config = {
  // 安全
  adminJwtSecret: env.ADMIN_JWT_SECRET,
  jwtSecret: env.JWT_SECRET,
  apiTokenSalt: env.API_TOKEN_SALT,
  encryptionKey: env.ENCRYPTION_KEY,

  // 数据库
  database: {
    client: env.DATABASE_CLIENT,
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
  },

  // API
  resend: {
    apiKey: env.RESEND_API_KEY,
    from: env.EMAIL_FROM,
  },

  // URLs
  urls: {
    frontend: env.FRONTEND_URL,
  },

  // 环境
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  nodeEnv: env.NODE_ENV,

  // 服务器
  server: {
    host: env.HOST,
    port: env.PORT,
  },
} as const;
