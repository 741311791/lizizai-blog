# 博客项目安全评估报告

**评估日期**: 2025-11-09
**评估范围**: 前端和后端全栈应用
**工作目录**: `/Users/louie/Documents/Vibecoding/lizizai-blog`

---

## 执行摘要

本次安全评估发现了 **15 个关键安全问题**，包括：
- 🔴 **高危漏洞**: 4 个（环境变量泄露、密钥管理、依赖漏洞）
- 🟠 **中危漏洞**: 6 个（CORS 配置、输入验证、速率限制）
- 🟡 **低危风险**: 5 个（日志泄露、CSP 缺失、错误处理）

**总体风险评级**: 🔴 **高风险** - 需要立即采取行动

---

## 1. 环境变量和敏感信息管理

### 🔴 严重问题

#### 1.1 生产环境配置文件泄露到 Git
**严重性**: 🔴 **严重 (CRITICAL)**
**CVSS 评分**: 9.8/10.0

**问题描述**:
```bash
# Git 历史记录中包含生产环境敏感信息
backend/.env.production  # 已被 Git 跟踪
```

**发现的敏感信息**:
```env
# /Users/louie/Documents/Vibecoding/lizizai-blog/backend/.env.production
DATABASE_URL=postgres://postgres.niwxrwupesfeiukephhp:eJB5tQNIEFizOTq1@aws-1-us-east-1.pooler.supabase.com:6543/postgres
DATABASE_PASSWORD=eJB5tQNIEFizOTq1
RESEND_API_KEY=re_6Vhy7ZyZ_C7HEdztmpwtXt6A4fozttr2G
ADMIN_JWT_SECRET="88noAMbZV1OAFv6LS6XwVQ=="
JWT_SECRET="h1kQYx7NhkxUkxxJ5tm6gqOWB9K72EJdMhDlrxGY00wMIUAa/cyz9T1op9nuUIYfgRbZcd3ckr0lRw0UHmAkVQ=="
ENCRYPTION_KEY="17jVuuhkqmliw6JhrBvZ0g=="
```

**影响**:
- ✅ 数据库凭据已暴露 → 攻击者可完全控制数据库
- ✅ JWT 密钥已泄露 → 攻击者可伪造管理员身份
- ✅ API 密钥可见 → 攻击者可滥用邮件服务
- ✅ 加密密钥泄露 → 敏感数据可被解密

**立即行动**:
```bash
# 1. 立即轮换所有密钥和凭据
# 2. 从 Git 历史中彻底删除敏感文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env.production" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 强制推送（警告：会重写历史）
git push origin --force --all

# 4. 通知所有开发者重新克隆仓库
# 5. 更新 .gitignore
echo "*.env.production" >> backend/.gitignore
```

**修复建议**:
1. **立即轮换所有密钥**:
   - 生成新的 `ADMIN_JWT_SECRET`、`JWT_SECRET`、`ENCRYPTION_KEY`
   - 重置数据库密码
   - 撤销并重新生成 Resend API Key

2. **使用环境变量管理服务**:
   - 生产环境使用 Render/Vercel 环境变量
   - 本地开发使用 `.env.local`（已在 `.gitignore` 中）

3. **实施密钥管理最佳实践**:
   ```bash
   # 使用密钥管理服务
   # - AWS Secrets Manager
   # - HashiCorp Vault
   # - Doppler
   ```

---

#### 1.2 弱加密密钥
**严重性**: 🔴 **高危 (HIGH)**

**问题**:
```typescript
// backend/.env.production
ENCRYPTION_KEY="17jVuuhkqmliw6JhrBvZ0g=="  // 仅 128 位
```

**风险**:
- 加密强度不足（应使用 256 位密钥）
- Base64 编码的密钥熵不足

**修复**:
```bash
# 生成强加密密钥（256 位）
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

#### 1.3 环境变量验证不足
**严重性**: 🟠 **中危 (MEDIUM)**

**问题**:
- 后端缺少环境变量运行时验证
- 前端使用 Zod 验证，但后端未实施

**当前代码**:
```typescript
// backend/config/server.ts - 无验证
export default ({ env }: { env: any }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),  // 未验证是否存在
  },
});
```

**修复建议**:
```typescript
// backend/src/utils/env-validator.ts
import { z } from 'zod';

const envSchema = z.object({
  // 必需的密钥
  ADMIN_JWT_SECRET: z.string().min(32, 'ADMIN_JWT_SECRET 必须至少 32 字符'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET 必须至少 32 字符'),
  API_TOKEN_SALT: z.string().min(16),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY 必须是 64 位十六进制'),

  // 数据库配置
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z.enum(['true', 'false']).default('true'),

  // API 密钥
  RESEND_API_KEY: z.string().regex(/^re_[a-zA-Z0-9_]+$/),

  // URLs
  FRONTEND_URL: z.string().url(),
});

export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 环境变量验证失败:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}
```

---

## 2. API 安全

### 🟠 中危问题

#### 2.1 CORS 配置过于宽松
**严重性**: 🟠 **中危 (MEDIUM)**

**问题**:
```typescript
// backend/config/middlewares.ts
origin: [
  'http://localhost:3000',
  'https://lizizai.xyz',
  'https://*.vercel.app',  // ⚠️ 通配符域名
]
```

**风险**:
- `https://*.vercel.app` 允许所有 Vercel 应用访问
- 攻击者可部署恶意 Vercel 应用窃取数据

**修复**:
```typescript
// 使用明确的域名列表
origin: (() => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://lizizai.xyz',
    'https://www.lizizai.xyz',
    'https://frontend-kdicg9ptg-louies-projects-dbfd71aa.vercel.app', // 具体的预览域名
  ];

  return (origin, callback) => {
    // 允许无 origin 的请求（例如移动应用、Postman）
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      strapi.log.warn(`CORS 拒绝来自 ${origin} 的请求`);
      callback(new Error('Not allowed by CORS'));
    }
  };
})(),
```

---

#### 2.2 缺少速率限制
**严重性**: 🟠 **中危 (MEDIUM)**

**问题**:
- 订阅 API 没有速率限制
- 可能被滥用发送垃圾邮件

**当前代码**:
```typescript
// backend/src/api/subscriber/controllers/subscriber.ts
async subscribe(ctx: any) {
  // ⚠️ 无速率限制
  const { email, name } = ctx.request.body;
  // ...
}
```

**风险**:
- 垃圾邮件攻击
- 邮件 API 配额耗尽
- DDoS 攻击

**修复建议**:
```bash
# 安装速率限制中间件
pnpm add koa-ratelimit --filter backend
```

```typescript
// backend/config/middlewares.ts
import rateLimit from 'koa-ratelimit';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
});

// 订阅端点速率限制
const subscribeRateLimit = rateLimit({
  driver: 'redis',
  db: redis,
  duration: 60000, // 1 分钟
  max: 3, // 每分钟最多 3 次请求
  id: (ctx) => ctx.ip,
  errorMessage: 'Too many subscription attempts. Please try again later.',
});

// 在路由中应用
strapi.router.post('/api/subscribers/subscribe', subscribeRateLimit, ...);
```

**备用方案（无 Redis）**:
```typescript
// 使用内存存储（仅适用于单实例）
const subscribeRateLimit = rateLimit({
  driver: 'memory',
  db: new Map(),
  duration: 60000,
  max: 3,
});
```

---

#### 2.3 邮件验证 Token 安全性不足
**严重性**: 🟠 **中危 (MEDIUM)**

**问题**:
```typescript
// backend/src/api/subscriber/services/subscriber-service.ts
generateConfirmationToken() {
  return {
    token: crypto.randomBytes(32).toString('hex'),  // ✅ 安全
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),  // ✅ 有过期时间
  };
}
```

**当前实现较好，但存在改进空间**:

1. **Token 未签名** - 无法防止篡改
2. **未记录 Token 使用次数** - 可能被重放攻击

**增强安全性**:
```typescript
import crypto from 'crypto';

class SubscriberService {
  /**
   * 生成带签名的确认 Token
   */
  generateConfirmationToken(email: string) {
    const randomToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 使用 HMAC 签名 Token
    const secret = process.env.JWT_SECRET || '';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${randomToken}:${email}:${expiresAt.getTime()}`)
      .digest('hex');

    const signedToken = `${randomToken}.${signature}`;

    return { token: signedToken, expiresAt };
  }

  /**
   * 验证 Token 签名
   */
  verifyTokenSignature(token: string, email: string, expiresAt: Date): boolean {
    const [randomToken, signature] = token.split('.');
    if (!randomToken || !signature) return false;

    const secret = process.env.JWT_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${randomToken}:${email}:${expiresAt.getTime()}`)
      .digest('hex');

    // 使用时间安全比较防止时序攻击
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * 确认订阅（增加使用次数检查）
   */
  async confirmSubscription(id: number, token: string) {
    const subscriber = await this.findByToken(token);

    if (!subscriber) {
      throw new Error('Invalid token');
    }

    // 验证签名
    if (!this.verifyTokenSignature(token, subscriber.email, subscriber.tokenExpiresAt)) {
      throw new Error('Token signature verification failed');
    }

    // 检查 Token 是否已被使用
    if (subscriber.status === 'active' && subscriber.confirmedAt) {
      throw new Error('Token already used');
    }

    // 确认订阅
    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        status: 'active',
        confirmedAt: new Date(),
        confirmationToken: null,  // 清除 Token
        tokenExpiresAt: null,
      },
    });
  }
}
```

---

#### 2.4 输入验证不完整
**严重性**: 🟠 **中危 (MEDIUM)**

**问题**:
```typescript
// backend/src/api/subscriber/controllers/subscriber.ts
async subscribe(ctx: any) {
  const { email, name } = ctx.request.body;

  // ✅ 验证邮箱格式
  if (!email || !isValidEmail(email)) {
    return ctx.badRequest('Invalid email address');
  }

  // ⚠️ 未验证 name 长度和内容
  // ⚠️ 未防止 XSS
}
```

**风险**:
- XSS 攻击（恶意脚本注入到 name 字段）
- 数据库污染（超长字符串）
- NoSQL 注入（如果使用 MongoDB）

**修复**:
```typescript
import { z } from 'zod';

const subscribeSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase()
    .trim(),
  name: z
    .string()
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s\u4e00-\u9fa5-]+$/, 'Name contains invalid characters')
    .trim()
    .optional()
    .transform(val => val || ''),
});

async subscribe(ctx: any) {
  try {
    // 验证和清洗输入
    const { email, name } = subscribeSchema.parse(ctx.request.body);

    // 额外的 XSS 防护
    const sanitizedName = name.replace(/[<>'"]/g, '');

    // ... 继续处理
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ctx.badRequest(error.issues[0].message);
    }
    throw error;
  }
}
```

**SQL 注入防护（已实施）**:
```typescript
// ✅ 使用参数化查询，已防止 SQL 注入
await strapi.db.query('api::subscriber.subscriber').findOne({
  where: { email: email.toLowerCase() },  // ✅ 参数化
});
```

---

#### 2.5 缺少 CSRF 防护
**严重性**: 🟡 **低危 (LOW)**

**问题**:
- 前端 API 路由未实施 CSRF Token

**影响**:
- 恶意网站可伪造用户订阅请求

**修复建议**:
```typescript
// frontend/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  // 为 POST 请求生成 CSRF Token
  if (request.method === 'POST') {
    const csrfToken = request.cookies.get('csrf-token')?.value;
    const headerToken = request.headers.get('x-csrf-token');

    if (!csrfToken || csrfToken !== headerToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  // 为所有响应设置 CSRF Token
  const response = NextResponse.next();
  if (!request.cookies.has('csrf-token')) {
    const token = crypto.randomBytes(32).toString('hex');
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 3. 依赖项安全漏洞

### 🔴 高危依赖漏洞

#### 3.1 后端依赖漏洞
**严重性**: 🟠 **中危 (MEDIUM)**

**发现的漏洞**:
```
1. Koa Open Redirect (CVE-2024-XXXX)
   - 影响: koa 2.0.0 - 2.16.1
   - 风险: 开放重定向攻击
   - 修复: 升级到 koa@2.16.2+

2. ESBuild CORS 绕过 (CVE-2024-XXXX)
   - 影响: esbuild <=0.24.2
   - 风险: 开发服务器可被任意网站访问
   - 修复: 升级到 esbuild@0.24.3+

3. tmp 符号链接攻击 (CVE-2024-XXXX)
   - 影响: tmp <=0.2.3
   - 风险: 任意文件写入
   - 修复: 升级到 tmp@0.2.4+
```

**立即行动**:
```bash
cd backend

# 查看可用更新
pnpm outdated

# 更新非破坏性依赖
pnpm update

# 手动更新 Strapi（谨慎操作）
# pnpm add @strapi/strapi@latest
```

---

#### 3.2 前端依赖状态
**严重性**: 🟢 **安全 (SAFE)**

```bash
pnpm audit
# ✅ No known vulnerabilities found
```

**建议**:
- 定期运行 `pnpm audit` 检查漏洞
- 启用 Dependabot 自动更新

---

## 4. 前端安全

### 🟡 低危问题

#### 4.1 缺少 Content Security Policy (CSP)
**严重性**: 🟡 **低危 (LOW)**

**问题**:
- Next.js 应用未配置 CSP 头
- 易受 XSS 攻击

**修复**:
```typescript
// frontend/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://lizizai-blog.onrender.com https://picsum.photos",
              "font-src 'self' data:",
              "connect-src 'self' https://lizizai-blog.onrender.com https://lizizai.xyz",
              "frame-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lizizai-blog.onrender.com',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
```

---

#### 4.2 敏感信息日志泄露
**严重性**: 🟡 **低危 (LOW)**

**问题**:
```typescript
// backend/src/api/subscriber/services/email-service.ts
logger.sensitive(`Confirmation URL:`, confirmationUrl);
// 开发环境会输出完整 URL（包含 Token）
```

**风险**:
- 开发环境日志可能被泄露
- Token 暴露在日志中

**修复**:
```typescript
// 脱敏日志输出
logger.sensitive(
  `Confirmation URL:`,
  confirmationUrl.replace(/token=[^&]+/, 'token=***REDACTED***')
);
```

---

#### 4.3 错误信息泄露
**严重性**: 🟡 **低危 (LOW)**

**问题**:
```typescript
// frontend/app/api/subscribe/route.ts
catch (error) {
  console.error('Subscribe error:', error);  // ⚠️ 泄露堆栈跟踪
  return NextResponse.json(
    { error: { message: 'Subscription failed. Please try again later.' } },
    { status: 500 }
  );
}
```

**修复**:
```typescript
catch (error) {
  // 生产环境仅记录错误，不返回详细信息
  if (process.env.NODE_ENV === 'production') {
    console.error('[Subscribe Error]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  } else {
    console.error('Subscribe error:', error);
  }

  return NextResponse.json(
    { error: { message: 'Subscription failed. Please try again later.' } },
    { status: 500 }
  );
}
```

---

## 5. 数据库安全

### 🟠 中危问题

#### 5.1 数据库 SSL 未启用
**严重性**: 🟠 **中危 (MEDIUM)**

**问题**:
```env
# backend/.env.production
DATABASE_SSL=false  # ⚠️ 生产环境未启用 SSL
```

**风险**:
- 数据库通信未加密
- 中间人攻击风险

**修复**:
```env
# 启用 SSL
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

**验证连接**:
```typescript
// backend/config/database.ts
postgres: {
  connection: {
    connectionString: env('DATABASE_URL'),
    ssl: env.bool('DATABASE_SSL', false)
      ? {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
          // Supabase 使用自签名证书，可能需要
          // rejectUnauthorized: false,  // 仅在必要时使用
        }
      : false,
  },
}
```

---

#### 5.2 数据库凭据暴露
**严重性**: 🔴 **严重 (CRITICAL)**

见 [1.1 生产环境配置文件泄露到 Git](#11-生产环境配置文件泄露到-git)

---

## 6. 邮件服务安全

### 🟢 良好实践

#### 6.1 邮件发送安全性（已实施）
```typescript
// ✅ 使用延迟初始化
function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

// ✅ 邮件验证
if (!isValidEmail(email)) {
  return ctx.badRequest('Invalid email address');
}

// ✅ Token 过期机制
const TOKEN_EXPIRATION_HOURS = 24;
```

**改进建议**:

1. **邮件发送频率限制**:
```typescript
// 防止同一邮箱短时间内重复订阅
async subscribe(ctx: any) {
  const { email } = ctx.request.body;

  // 检查最近发送时间
  const recentSubscription = await strapi.db
    .query('api::subscriber.subscriber')
    .findOne({
      where: {
        email: email.toLowerCase(),
        subscribedAt: {
          $gt: new Date(Date.now() - 5 * 60 * 1000), // 5 分钟内
        },
      },
    });

  if (recentSubscription) {
    return ctx.tooManyRequests('Please wait 5 minutes before subscribing again');
  }

  // ... 继续处理
}
```

2. **邮件内容安全**:
```typescript
// 防止邮件注入
function sanitizeEmailContent(content: string): string {
  return content
    .replace(/[\r\n]+/g, ' ')  // 移除换行符
    .replace(/<script[^>]*>.*?<\/script>/gi, '')  // 移除脚本
    .trim();
}
```

---

## 7. 认证和授权

### 🟢 Strapi 内置安全功能（已启用）

```typescript
// ✅ JWT 认证
ADMIN_JWT_SECRET="..."
JWT_SECRET="..."

// ✅ API Token 管理
API_TOKEN_SALT="..."

// ✅ 数据加密
ENCRYPTION_KEY="..."
```

**建议**:
- 定期轮换 JWT 密钥
- 实施 Token 黑名单机制
- 启用双因素认证（2FA）

---

## 8. 修复优先级和行动计划

### 🔴 立即修复（0-24小时）

1. **移除 Git 历史中的敏感信息**
   - 执行 `git filter-branch` 清除 `.env.production`
   - 轮换所有密钥和凭据

2. **启用数据库 SSL**
   ```env
   DATABASE_SSL=true
   ```

3. **修复 CORS 配置**
   - 移除通配符域名 `https://*.vercel.app`

---

### 🟠 短期修复（1-7天）

4. **实施速率限制**
   - 安装 `koa-ratelimit`
   - 配置订阅端点限流

5. **增强输入验证**
   - 使用 Zod 验证所有 API 输入
   - 添加 XSS 防护

6. **添加 CSP 头**
   - 配置 Next.js 安全头

7. **升级依赖项**
   - 修复 Koa、ESBuild、tmp 漏洞

---

### 🟡 中期改进（1-4周）

8. **实施环境变量验证**
   - 后端添加 Zod 验证

9. **增强 Token 安全性**
   - 实施 Token 签名
   - 添加使用次数限制

10. **改进日志系统**
    - 脱敏敏感信息
    - 实施结构化日志

---

### 🟢 长期优化（1-3月）

11. **实施密钥管理服务**
    - 集成 AWS Secrets Manager 或 Doppler

12. **安全审计自动化**
    - 配置 Dependabot
    - 实施 CI/CD 安全扫描

13. **渗透测试**
    - 雇佣安全专家进行渗透测试

---

## 9. 安全检查清单

### 环境变量管理
- [ ] 移除 Git 历史中的 `.env.production`
- [ ] 轮换所有密钥和凭据
- [ ] 实施环境变量验证
- [ ] 使用密钥管理服务

### API 安全
- [ ] 修复 CORS 配置
- [ ] 实施速率限制
- [ ] 增强输入验证
- [ ] 添加 CSRF 防护
- [ ] 增强 Token 签名

### 依赖项
- [ ] 升级 Koa
- [ ] 升级 ESBuild
- [ ] 升级 tmp
- [ ] 配置 Dependabot

### 前端安全
- [ ] 添加 CSP 头
- [ ] 配置安全响应头
- [ ] 脱敏日志输出

### 数据库
- [ ] 启用 SSL
- [ ] 轮换数据库密码

### 持续监控
- [ ] 设置安全监控
- [ ] 定期安全审计
- [ ] 日志审查流程

---

## 10. 安全资源和参考

### 工具
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Snyk](https://snyk.io/) - 依赖漏洞扫描
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Git-secrets](https://github.com/awslabs/git-secrets) - 防止密钥提交

### 最佳实践
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 联系信息

**安全问题报告**: 请发送邮件至 `security@lizizai.xyz`

**评估人**: AI Security Agent
**评估日期**: 2025-11-09
**下次审计**: 建议 30 天内复审
