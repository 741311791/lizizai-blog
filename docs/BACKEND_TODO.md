# 后端任务清单 (Backend TODO)

**项目**: lizizai-blog Backend (Strapi CMS)
**更新时间**: 2025-11-03
**总任务数**: 9 个
**预计总工作量**: ~7 天

---

## 📋 任务概览

| 优先级 | 任务数 | 预计工作量 | 状态 |
|--------|--------|-----------|------|
| P0 严重 | 1 | 3-5 天 | ✅ 已完成 |
| P1 重要 | 5 | 5 小时 | ✅ 已完成 |
| P2 改进 | 2 | 1.5 天 | 🔄 进行中 (1/2 - Task 8 需 Redis) |
| P3 优化 | 1 | 1 小时 | ✅ 已完成 |

---

## 🔴 P0 - 严重问题（立即处理）

### ✅ Task 1: 启用 TypeScript Strict 模式

**优先级**: P0
**预计工作量**: 3-5 天
**影响范围**: 整个后端代码库
**负责人**: _待分配_

#### 问题描述
- **位置**: `backend/tsconfig.json:7`
- **当前状态**: `"strict": false`
- **风险**: 类型安全性严重不足，容易出现运行时错误

#### 修复步骤

**Step 1: 启用 strict 模式**
```json
// backend/tsconfig.json
{
  "compilerOptions": {
    "strict": true,  // ✅ 改为 true
    // ... 其他配置保持不变
  }
}
```

**Step 2: 逐步修复类型错误**
```bash
# 1. 编译查看错误
pnpm run build

# 2. 常见错误类型修复
```

**常见错误修复示例**:

```typescript
// ❌ 错误: 隐式 any 类型
export default {
  async subscribe(ctx) {  // ctx 没有类型
    const { email, name } = ctx.request.body;
  }
}

// ✅ 修复
import { Context } from 'koa';
export default {
  async subscribe(ctx: Context) {
    const { email, name } = ctx.request.body as { email: string; name?: string };
  }
}
```

```typescript
// ❌ 错误: 可能为 null/undefined
const subscriber = await strapi.db.query('api::subscriber.subscriber').findOne({
  where: { email: email.toLowerCase() },
});
if (subscriber.status === 'active') {  // subscriber 可能为 null
  // ...
}

// ✅ 修复
const subscriber = await strapi.db.query('api::subscriber.subscriber').findOne({
  where: { email: email.toLowerCase() },
});
if (subscriber && subscriber.status === 'active') {
  // ...
}
```

#### 验收标准
- [x] `tsconfig.json` 中 `strict` 设置为 `true` ✅
- [x] `pnpm run build` 成功无类型错误 ✅
- [x] 所有 API 端点正常运行 ✅
- [x] 现有功能测试通过 ✅

**✅ 已完成** (2025-11-05)
- 启用了 TypeScript strict 模式
- 修复了所有类型错误
- 构建成功,无类型警告
- 所有 API 测试通过 (22/22 tests passed)

#### 相关文件
- `backend/tsconfig.json`
- `backend/src/api/**/*.ts`
- `backend/src/index.ts`
- `backend/config/**/*.ts`

---

## 🟠 P1 - 重要问题（本周内完成）

### ✅ Task 2: 修复数据库 SSL 安全配置

**优先级**: P1
**预计工作量**: 1 小时
**影响范围**: 数据库连接安全性
**负责人**: _待分配_

#### 问题描述
- **位置**: `backend/config/database.ts:33-34`
- **当前状态**: SSL 证书验证被关闭
- **风险**: 中间人攻击风险

#### 修复步骤

```typescript
// backend/config/database.ts
export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    // ... mysql 配置

    postgres: {
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        // ✅ 修复 SSL 配置
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool(
            'DATABASE_SSL_REJECT_UNAUTHORIZED',
            true  // ✅ 默认启用证书验证
          ),
          ca: env('DATABASE_SSL_CA', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          key: env('DATABASE_SSL_KEY', undefined),
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    // ...
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
```

**环境变量配置**:
```env
# .env.production
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# 开发环境可以关闭（如使用本地数据库）
# .env.local
DATABASE_SSL=false
```

#### 验收标准
- [ ] SSL 配置可通过环境变量控制
- [ ] 生产环境启用证书验证
- [ ] 数据库连接测试通过
- [ ] 部署后应用正常运行

#### 相关文件
- `backend/config/database.ts`
- `backend/.env.production`
- `backend/.env.example`

---

### ✅ Task 3: 修复邮件发送失败的数据清理逻辑

**优先级**: P1
**预计工作量**: 2 小时
**影响范围**: 订阅流程数据一致性
**负责人**: _待分配_

#### 问题描述
- **位置**: `backend/src/api/subscriber/controllers/subscriber.ts:88-92`
- **问题**: 更新订阅场景下，邮件发送失败但 token 已更新，导致数据不一致
- **风险**: 用户无法收到确认邮件，但数据库状态已改变

#### 修复步骤

```typescript
// backend/src/api/subscriber/controllers/subscriber.ts

export default {
  async subscribe(ctx: any) {
    try {
      const { email, name } = ctx.request.body;

      // 验证邮箱
      if (!email || !isValidEmail(email)) {
        return ctx.badRequest('Invalid email address');
      }

      // 检查是否已订阅
      const existing = await strapi.db.query('api::subscriber.subscriber').findOne({
        where: { email: email.toLowerCase() },
      });

      let subscriber;
      let isNewSubscriber = false;

      // ✅ 保存原始状态用于回滚
      let originalState: any = null;

      if (existing) {
        // ✅ 保存更新前的状态
        originalState = {
          confirmationToken: existing.confirmationToken,
          tokenExpiresAt: existing.tokenExpiresAt,
          name: existing.name,
          status: existing.status,
        };

        if (existing.status === 'active') {
          return ctx.send({
            message: 'Email already subscribed',
            alreadySubscribed: true
          });
        } else if (existing.status === 'pending') {
          // 重新发送确认邮件
          const confirmationToken = crypto.randomBytes(32).toString('hex');
          const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

          subscriber = await strapi.db.query('api::subscriber.subscriber').update({
            where: { id: existing.id },
            data: {
              confirmationToken,
              tokenExpiresAt,
              name: name || existing.name,
            },
          });
        } else {
          // 重新订阅
          const confirmationToken = crypto.randomBytes(32).toString('hex');
          const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

          subscriber = await strapi.db.query('api::subscriber.subscriber').update({
            where: { id: existing.id },
            data: {
              status: 'pending',
              confirmationToken,
              tokenExpiresAt,
              subscribedAt: new Date(),
              name: name || existing.name,
            },
          });
        }
      } else {
        // 创建新订阅者
        isNewSubscriber = true;
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        subscriber = await strapi.db.query('api::subscriber.subscriber').create({
          data: {
            email: email.toLowerCase(),
            name: name || '',
            status: 'pending',
            confirmationToken,
            tokenExpiresAt,
            subscribedAt: new Date(),
            source: 'website',
          },
        });
      }

      // 发送确认邮件
      try {
        const confirmationUrl = `${process.env.FRONTEND_URL}/api/subscribe/confirm?token=${subscriber.confirmationToken}`;

        await sendConfirmationEmail(email, name || '', confirmationUrl);

        strapi.log.info(`Confirmation email sent to ${email}`);
      } catch (emailError) {
        strapi.log.error('Failed to send confirmation email:', emailError);

        // ✅ 改进：根据场景进行不同的回滚处理
        if (isNewSubscriber) {
          // 新建场景：删除创建的记录
          await strapi.db.query('api::subscriber.subscriber').delete({
            where: { id: subscriber.id },
          });
          strapi.log.info(`Rolled back new subscriber creation for ${email}`);
        } else if (originalState) {
          // 更新场景：恢复原始状态
          await strapi.db.query('api::subscriber.subscriber').update({
            where: { id: subscriber.id },
            data: {
              confirmationToken: originalState.confirmationToken,
              tokenExpiresAt: originalState.tokenExpiresAt,
              name: originalState.name,
              status: originalState.status,
            },
          });
          strapi.log.info(`Rolled back subscriber update for ${email}`);
        }

        return ctx.internalServerError('Failed to send confirmation email. Please try again later.');
      }

      return ctx.send({
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
        subscriber: {
          email: subscriber.email,
          name: subscriber.name,
        }
      });
    } catch (error) {
      strapi.log.error('Subscribe error:', error);
      return ctx.internalServerError('Subscription failed. Please try again later.');
    }
  },
  // ... 其他方法
};
```

#### 验收标准
- [ ] 新建订阅失败时正确删除记录
- [ ] 更新订阅失败时正确回滚到原始状态
- [ ] 添加详细的日志记录
- [ ] 手动测试各种失败场景

#### 测试场景
1. 新用户订阅，邮件发送失败 → 数据库无记录
2. 已有用户重新订阅，邮件发送失败 → 恢复原始 token 和状态
3. Pending 用户重新发送，邮件发送失败 → 保持原始 token

#### 相关文件
- `backend/src/api/subscriber/controllers/subscriber.ts`

---

### ✅ Task 4: 配置化硬编码 URL

**优先级**: P1
**预计工作量**: 30 分钟
**影响范围**: 邮件确认链接生成
**负责人**: _待分配_

#### 问题描述
- **位置**: `backend/src/api/subscriber/controllers/subscriber.ts:77`
- **问题**: 前端域名硬编码为 `https://lizizai.xyz`
- **影响**: 无法在不同环境（开发、测试、生产）使用不同域名

#### 修复步骤

**Step 1: 添加环境变量**

```env
# backend/.env.local (开发环境)
FRONTEND_URL=http://localhost:3000

# backend/.env.production (生产环境)
FRONTEND_URL=https://lizizai.xyz

# backend/.env.example
FRONTEND_URL=http://localhost:3000
```

**Step 2: 更新代码**

```typescript
// backend/src/api/subscriber/controllers/subscriber.ts:77

// ❌ 修改前
const confirmationUrl = `https://lizizai.xyz/api/subscribe/confirm?token=${subscriber.confirmationToken}`;

// ✅ 修改后
const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/subscribe/confirm?token=${subscriber.confirmationToken}`;
```

**Step 3: 添加环境变量验证（可选但推荐）**

```typescript
// backend/src/index.ts
export default {
  register({ strapi }) {
    // 验证必需的环境变量
    const requiredEnvVars = ['FRONTEND_URL', 'RESEND_API_KEY'];
    const missing = requiredEnvVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
      strapi.log.error(`Missing required environment variables: ${missing.join(', ')}`);
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  },
  // ...
};
```

#### 验收标准
- [ ] 环境变量在所有 `.env` 文件中配置
- [ ] 确认邮件链接使用环境变量
- [ ] 不同环境测试通过（本地、生产）
- [ ] 添加环境变量验证逻辑

#### 相关文件
- `backend/src/api/subscriber/controllers/subscriber.ts`
- `backend/.env.local`
- `backend/.env.production`
- `backend/.env.example`

---

### ✅ Task 5: 改进环境变量示例文件

**优先级**: P1
**预计工作量**: 1 小时
**影响范围**: 新环境部署安全性
**负责人**: _待分配_

#### 问题描述
- **位置**: `backend/.env.example`
- **问题**: 包含明显的占位符（`toBeModified`），容易被忽略更新
- **风险**: 生产环境使用不安全的默认值

#### 修复步骤

**Step 1: 更新 .env.example**

```env
# backend/.env.example

# Server Configuration
HOST=0.0.0.0
PORT=1337

# Application Keys (MUST be changed in production!)
# Generate using: node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
APP_KEYS="GENERATE_RANDOM_KEY_1,GENERATE_RANDOM_KEY_2"

# API Token Salt (MUST be changed in production!)
# Generate using: openssl rand -base64 32
API_TOKEN_SALT=GENERATE_RANDOM_SALT

# JWT Secrets (MUST be changed in production!)
# Generate using: openssl rand -base64 32
ADMIN_JWT_SECRET=GENERATE_RANDOM_SECRET
JWT_SECRET=GENERATE_RANDOM_SECRET
TRANSFER_TOKEN_SALT=GENERATE_RANDOM_SALT

# Encryption Key (MUST be changed in production!)
# Generate using: openssl rand -hex 32
ENCRYPTION_KEY=GENERATE_RANDOM_ENCRYPTION_KEY

# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=CHANGE_ME
DATABASE_SSL=false
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# Frontend URL (for email confirmation links)
FRONTEND_URL=http://localhost:3000

# Email Service (Resend)
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EMAIL_FROM="Your Blog <noreply@yourdomain.com>"
```

**Step 2: 创建环境变量验证脚本**

```javascript
// backend/scripts/validate-env.js
const crypto = require('crypto');

const DANGEROUS_VALUES = [
  'tobemodified',
  'tobemodified1',
  'tobemodified2',
  'changeMe',
  'change_me',
  'generate_random',
  'your_secret',
  'secret',
  'password',
  'example',
];

const REQUIRED_VARS = [
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'JWT_SECRET',
  'TRANSFER_TOKEN_SALT',
  'RESEND_API_KEY',
  'FRONTEND_URL',
];

function validateEnv() {
  console.log('🔍 Validating environment variables...\n');

  let hasErrors = false;

  // 检查必需的环境变量
  REQUIRED_VARS.forEach(key => {
    if (!process.env[key]) {
      console.error(`❌ Missing required environment variable: ${key}`);
      hasErrors = true;
    }
  });

  // 检查危险的默认值
  Object.entries(process.env).forEach(([key, value]) => {
    const lowerValue = (value || '').toLowerCase();
    const hasDangerousValue = DANGEROUS_VALUES.some(dangerous =>
      lowerValue.includes(dangerous)
    );

    if (hasDangerousValue) {
      console.error(`❌ Dangerous default value detected in ${key}`);
      console.error(`   Please generate a secure random value for this variable.`);
      hasErrors = true;
    }
  });

  if (hasErrors) {
    console.error('\n❌ Environment validation failed!');
    console.error('Please fix the issues above before starting the application.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed!\n');
}

if (process.env.NODE_ENV === 'production') {
  validateEnv();
}

module.exports = { validateEnv };
```

**Step 3: 创建密钥生成脚本**

```javascript
// backend/scripts/generate-secrets.js
const crypto = require('crypto');

console.log('🔐 Generating secure secrets for Strapi\n');
console.log('Copy these values to your .env file:\n');
console.log('─'.repeat(60));

const appKey1 = crypto.randomBytes(16).toString('base64');
const appKey2 = crypto.randomBytes(16).toString('base64');
console.log(`APP_KEYS="${appKey1},${appKey2}"`);

console.log(`API_TOKEN_SALT=${crypto.randomBytes(32).toString('base64')}`);
console.log(`ADMIN_JWT_SECRET=${crypto.randomBytes(32).toString('base64')}`);
console.log(`JWT_SECRET=${crypto.randomBytes(32).toString('base64')}`);
console.log(`TRANSFER_TOKEN_SALT=${crypto.randomBytes(32).toString('base64')}`);
console.log(`ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}`);

console.log('─'.repeat(60));
console.log('\n✅ Secrets generated successfully!');
console.log('⚠️  Keep these values secure and never commit them to git!\n');
```

**Step 4: 更新 package.json**

```json
{
  "scripts": {
    "generate:secrets": "node scripts/generate-secrets.js",
    "validate:env": "node scripts/validate-env.js",
    "start": "node scripts/validate-env.js && strapi start",
    "develop": "strapi develop"
  }
}
```

#### 验收标准
- [ ] `.env.example` 更新为清晰的占位符
- [ ] 添加密钥生成说明和脚本
- [ ] 创建环境变量验证脚本
- [ ] 生产环境启动前自动验证
- [ ] 更新部署文档

#### 相关文件
- `backend/.env.example`
- `backend/scripts/validate-env.js` (新建)
- `backend/scripts/generate-secrets.js` (新建)
- `backend/package.json`

---

### ✅ Task 6: 添加 CORS 精确配置

**优先级**: P1
**预计工作量**: 30 分钟
**影响范围**: API 安全性
**负责人**: _待分配_

#### 问题描述
- **位置**: `backend/config/middlewares.ts:35-42`
- **问题**: CORS 允许所有 `*.vercel.app` 子域
- **风险**: 潜在的跨域攻击风险

#### 修复步骤

```typescript
// backend/config/middlewares.ts

export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            // ✅ 使用环境变量配置具体域名
            ...(process.env.CDN_DOMAINS?.split(',') || []),
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'dl.airtable.com',
            ...(process.env.CDN_DOMAINS?.split(',') || []),
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      // ✅ 使用环境变量配置允许的域名
      origin: process.env.CORS_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [
        'http://localhost:3000',
        'https://lizizai.xyz',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

**环境变量配置**:

```env
# .env.local (开发环境)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# .env.production (生产环境)
CORS_ORIGINS=https://lizizai.xyz,https://www.lizizai.xyz

# CDN 域名（如使用）
CDN_DOMAINS=https://cdn.lizizai.xyz
```

#### 验收标准
- [ ] CORS 配置从环境变量读取
- [ ] 生产环境仅允许具体域名
- [ ] 开发环境可灵活配置
- [ ] 跨域请求测试通过

#### 相关文件
- `backend/config/middlewares.ts`
- `backend/.env.local`
- `backend/.env.production`

---

## 🟡 P2 - 改进建议（2周内完成）

### ✅ Task 7: 重构订阅控制器（应用 KISS 原则）

**优先级**: P2
**预计工作量**: 1 天
**影响范围**: 代码可维护性
**负责人**: _待分配_

#### 问题描述
- **位置**: `backend/src/api/subscriber/controllers/subscriber.ts`
- **问题**: 231 行单文件，`subscribe()` 函数圈复杂度 ~10
- **违反原则**: KISS（简单至上）、单一职责原则

#### 重构方案

**Step 1: 创建服务层**

```typescript
// backend/src/api/subscriber/services/subscriber-service.ts

import crypto from 'crypto';

// 常量定义
const TOKEN_EXPIRATION_HOURS = 24;

export class SubscriberService {
  /**
   * 根据邮箱查找订阅者
   */
  async findByEmail(email: string) {
    return await strapi.db.query('api::subscriber.subscriber').findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * 生成确认 token
   */
  generateConfirmationToken() {
    return {
      token: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000),
    };
  }

  /**
   * 创建新订阅者（待确认状态）
   */
  async createPendingSubscriber(email: string, name: string) {
    const { token, expiresAt } = this.generateConfirmationToken();

    return await strapi.db.query('api::subscriber.subscriber').create({
      data: {
        email: email.toLowerCase(),
        name: name || '',
        status: 'pending',
        confirmationToken: token,
        tokenExpiresAt: expiresAt,
        subscribedAt: new Date(),
        source: 'website',
      },
    });
  }

  /**
   * 更新订阅者 token（用于重新发送确认邮件）
   */
  async updateSubscriberToken(id: number, name?: string) {
    const { token, expiresAt } = this.generateConfirmationToken();

    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        confirmationToken: token,
        tokenExpiresAt: expiresAt,
        ...(name && { name }),
      },
    });
  }

  /**
   * 重新激活订阅者（之前取消订阅的用户）
   */
  async reactivateSubscriber(id: number, name: string) {
    const { token, expiresAt } = this.generateConfirmationToken();

    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        status: 'pending',
        confirmationToken: token,
        tokenExpiresAt: expiresAt,
        subscribedAt: new Date(),
        name: name || '',
      },
    });
  }

  /**
   * 回滚订阅者状态
   */
  async rollbackSubscriber(id: number, originalState: any) {
    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: originalState,
    });
  }

  /**
   * 删除订阅者
   */
  async deleteSubscriber(id: number) {
    return await strapi.db.query('api::subscriber.subscriber').delete({
      where: { id },
    });
  }

  /**
   * 确认订阅
   */
  async confirmSubscription(id: number) {
    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        status: 'active',
        confirmedAt: new Date(),
        confirmationToken: null,
        tokenExpiresAt: null,
      },
    });
  }

  /**
   * 取消订阅
   */
  async unsubscribe(id: number) {
    return await strapi.db.query('api::subscriber.subscriber').update({
      where: { id },
      data: {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      },
    });
  }

  /**
   * 获取活跃订阅者数量
   */
  async getActiveCount() {
    return await strapi.db.query('api::subscriber.subscriber').count({
      where: { status: 'active' },
    });
  }

  /**
   * 检查 token 是否过期
   */
  isTokenExpired(tokenExpiresAt: Date): boolean {
    return new Date(tokenExpiresAt) < new Date();
  }
}

export default new SubscriberService();
```

**Step 2: 创建邮件服务包装**

```typescript
// backend/src/api/subscriber/services/email-service.ts

import { sendConfirmationEmail, sendWelcomeEmail } from './resend-service';

export class EmailService {
  /**
   * 发送确认邮件（带错误处理）
   */
  async sendConfirmation(email: string, name: string, token: string): Promise<void> {
    const confirmationUrl = `${process.env.FRONTEND_URL}/api/subscribe/confirm?token=${token}`;

    try {
      await sendConfirmationEmail(email, name, confirmationUrl);
      strapi.log.info(`Confirmation email sent to ${email}`);
    } catch (error) {
      strapi.log.error('Failed to send confirmation email:', error);
      throw error;
    }
  }

  /**
   * 发送欢迎邮件（不抛出错误，仅记录）
   */
  async sendWelcome(email: string, name: string): Promise<void> {
    try {
      await sendWelcomeEmail(email, name);
      strapi.log.info(`Welcome email sent to ${email}`);
    } catch (error) {
      strapi.log.error('Failed to send welcome email:', error);
      // 不抛出错误，不影响主流程
    }
  }
}

export default new EmailService();
```

**Step 3: 简化控制器**

```typescript
// backend/src/api/subscriber/controllers/subscriber.ts

import { isValidEmail } from '../services/email-templates';
import subscriberService from '../services/subscriber-service';
import emailService from '../services/email-service';

export default {
  /**
   * 订阅处理（简化版）
   */
  async subscribe(ctx: any) {
    try {
      const { email, name } = ctx.request.body;

      // 1. 验证输入
      if (!email || !isValidEmail(email)) {
        return ctx.badRequest('Invalid email address');
      }

      // 2. 检查现有订阅
      const existing = await subscriberService.findByEmail(email);

      // 3. 处理不同状态
      const result = await this.handleSubscriberState(existing, email, name);

      if (result.alreadySubscribed) {
        return ctx.send(result);
      }

      // 4. 发送确认邮件
      try {
        await emailService.sendConfirmation(
          result.subscriber.email,
          result.subscriber.name,
          result.subscriber.confirmationToken
        );
      } catch (emailError) {
        // 回滚数据变更
        await this.rollbackSubscription(result, existing);
        return ctx.internalServerError('Failed to send confirmation email. Please try again later.');
      }

      // 5. 返回成功响应
      return ctx.send({
        message: 'Please check your email to confirm your subscription.',
        requiresConfirmation: true,
        subscriber: {
          email: result.subscriber.email,
          name: result.subscriber.name,
        },
      });
    } catch (error) {
      strapi.log.error('Subscribe error:', error);
      return ctx.internalServerError('Subscription failed. Please try again later.');
    }
  },

  /**
   * 处理订阅者状态（状态机模式）
   */
  async handleSubscriberState(existing: any, email: string, name: string) {
    if (!existing) {
      // 新订阅者
      const subscriber = await subscriberService.createPendingSubscriber(email, name);
      return { subscriber, isNew: true };
    }

    if (existing.status === 'active') {
      // 已激活
      return { alreadySubscribed: true };
    }

    if (existing.status === 'pending') {
      // 重新发送确认
      const subscriber = await subscriberService.updateSubscriberToken(
        existing.id,
        name || existing.name
      );
      return { subscriber, isNew: false, originalState: existing };
    }

    // 重新激活（之前取消订阅）
    const subscriber = await subscriberService.reactivateSubscriber(existing.id, name);
    return { subscriber, isNew: false, originalState: existing };
  },

  /**
   * 回滚订阅操作
   */
  async rollbackSubscription(result: any, existing: any) {
    if (result.isNew) {
      await subscriberService.deleteSubscriber(result.subscriber.id);
      strapi.log.info(`Rolled back new subscriber: ${result.subscriber.email}`);
    } else if (result.originalState) {
      await subscriberService.rollbackSubscriber(result.subscriber.id, {
        confirmationToken: result.originalState.confirmationToken,
        tokenExpiresAt: result.originalState.tokenExpiresAt,
        name: result.originalState.name,
        status: result.originalState.status,
      });
      strapi.log.info(`Rolled back subscriber update: ${result.subscriber.email}`);
    }
  },

  /**
   * 取消订阅
   */
  async unsubscribe(ctx: any) {
    try {
      const { email } = ctx.request.body;

      if (!email || !isValidEmail(email)) {
        return ctx.badRequest('Invalid email address');
      }

      const subscriber = await subscriberService.findByEmail(email);

      if (!subscriber) {
        return ctx.notFound('Email not found in subscriber list');
      }

      if (subscriber.status === 'unsubscribed') {
        return ctx.send({ message: 'Email already unsubscribed' });
      }

      await subscriberService.unsubscribe(subscriber.id);

      return ctx.send({ message: 'Successfully unsubscribed' });
    } catch (error) {
      strapi.log.error('Unsubscribe error:', error);
      return ctx.internalServerError('Unsubscribe failed. Please try again later.');
    }
  },

  /**
   * 获取订阅者数量
   */
  async count(ctx: any) {
    try {
      const count = await subscriberService.getActiveCount();
      return ctx.send({ count });
    } catch (error) {
      strapi.log.error('Count error:', error);
      return ctx.internalServerError('Failed to get subscriber count');
    }
  },

  /**
   * 确认订阅
   */
  async confirm(ctx: any) {
    try {
      const { token } = ctx.query;

      if (!token) {
        return ctx.badRequest('Confirmation token is required');
      }

      const subscriber = await strapi.db.query('api::subscriber.subscriber').findOne({
        where: { confirmationToken: token },
      });

      if (!subscriber) {
        return ctx.notFound('Invalid confirmation token');
      }

      // 检查过期
      if (subscriberService.isTokenExpired(subscriber.tokenExpiresAt)) {
        return ctx.badRequest('Confirmation token has expired. Please subscribe again.');
      }

      // 检查已确认
      if (subscriber.status === 'active' && subscriber.confirmedAt) {
        return ctx.send({
          message: 'Email already confirmed',
          alreadyConfirmed: true,
        });
      }

      // 确认订阅
      await subscriberService.confirmSubscription(subscriber.id);

      // 发送欢迎邮件（不阻塞响应）
      emailService.sendWelcome(subscriber.email, subscriber.name);

      return ctx.send({
        message: 'Subscription confirmed successfully! Welcome to future/proof.',
        success: true,
      });
    } catch (error) {
      strapi.log.error('Confirm subscription error:', error);
      return ctx.internalServerError('Confirmation failed. Please try again later.');
    }
  },
};
```

#### 验收标准
- [ ] 服务层独立可测试
- [ ] 控制器函数平均长度 < 50 行
- [ ] 单一职责原则清晰
- [ ] 所有原有功能正常运行
- [ ] 代码圈复杂度 < 8

#### 相关文件
- `backend/src/api/subscriber/controllers/subscriber.ts` (重构)
- `backend/src/api/subscriber/services/subscriber-service.ts` (新建)
- `backend/src/api/subscriber/services/email-service.ts` (新建)

---

### ⏳ Task 8: 添加全局速率限制 (需要 Redis)

**优先级**: P2
**预计工作量**: 4 小时
**影响范围**: API 安全性和性能
**负责人**: _待分配_
**状态**: ⏳ 待开始 (依赖 Redis 基础设施)

#### 问题描述
- **位置**: Backend API 层
- **问题**: 仅文章点赞有限流，其他端点无保护
- **风险**: DDoS 攻击、暴力破解
- **依赖**: 需要 Redis 服务支持

#### 修复步骤

**Step 1: 安装依赖**

```bash
pnpm add @strapi/plugin-users-permissions koa-ratelimit ioredis
```

**Step 2: 创建速率限制中间件**

```typescript
// backend/src/middlewares/rate-limit.ts

import rateLimit from 'koa-ratelimit';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// 通用速率限制配置
const generalLimiter = rateLimit({
  driver: 'redis',
  db: redis,
  duration: 60000, // 1 分钟
  errorMessage: 'Too many requests, please try again later.',
  id: (ctx) => ctx.ip,
  headers: {
    remaining: 'Rate-Limit-Remaining',
    reset: 'Rate-Limit-Reset',
    total: 'Rate-Limit-Total',
  },
  max: 100, // 每分钟 100 个请求
  disableHeader: false,
});

// 严格速率限制（用于敏感操作）
const strictLimiter = rateLimit({
  driver: 'redis',
  db: redis,
  duration: 60000,
  errorMessage: 'Too many attempts, please try again later.',
  id: (ctx) => ctx.ip,
  max: 10, // 每分钟 10 个请求
});

// 订阅相关操作的限制
const subscribeLimiter = rateLimit({
  driver: 'redis',
  db: redis,
  duration: 3600000, // 1 小时
  errorMessage: 'Too many subscription attempts, please try again later.',
  id: (ctx) => {
    const email = ctx.request.body?.email;
    return email ? `${ctx.ip}:${email}` : ctx.ip;
  },
  max: 5, // 每小时 5 次
});

export default () => async (ctx, next) => {
  const path = ctx.path;

  // 根据路径选择限制器
  if (path.includes('/api/subscribers')) {
    return subscribeLimiter(ctx, next);
  } else if (path.includes('/api/auth') || path.includes('/admin')) {
    return strictLimiter(ctx, next);
  } else if (path.startsWith('/api/')) {
    return generalLimiter(ctx, next);
  }

  await next();
};
```

**Step 3: 注册中间件**

```typescript
// backend/config/middlewares.ts

export default [
  'strapi::logger',
  'strapi::errors',
  // ... 安全和 CORS 配置

  // ✅ 添加速率限制
  'global::rate-limit',

  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

**Step 4: 环境变量配置**

```env
# .env.local / .env.production
REDIS_URL=redis://localhost:6379
# 或分别配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

**Step 5: Docker Compose（本地开发）**

```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

#### 验收标准
- [ ] Redis 连接配置成功
- [ ] 通用 API 限制每分钟 100 次
- [ ] 订阅操作限制每小时 5 次
- [ ] 认证端点限制每分钟 10 次
- [ ] 返回正确的 rate limit headers
- [ ] 超限时返回 429 状态码

#### 测试方法

```bash
# 测试通用限制
for i in {1..101}; do curl http://localhost:1337/api/articles; done

# 测试订阅限制
for i in {1..6}; do
  curl -X POST http://localhost:1337/api/subscribers/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","name":"Test"}'
done
```

#### 相关文件
- `backend/src/middlewares/rate-limit.ts` (新建)
- `backend/config/middlewares.ts`
- `backend/.env.example`
- `docker-compose.yml` (新建或更新)

---

## 🟢 P3 - 优化建议（1月内完成）

### ✅ Task 9: 优化日志级别和内容

**优先级**: P3
**预计工作量**: 1 小时
**影响范围**: 生产环境日志质量
**负责人**: _待分配_

#### 问题描述
- **位置**: `backend/src/api/subscriber/controllers/subscriber.ts`
- **问题**: 生产环境输出过多 info 日志，包含敏感信息（token）
- **影响**: 日志噪音、潜在安全风险

#### 修复步骤

**Step 1: 创建日志工具**

```typescript
// backend/src/utils/logger.ts

export const logger = {
  /**
   * 开发环境详细日志
   */
  dev: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      strapi.log.debug(message, data);
    }
  },

  /**
   * 仅开发环境显示敏感信息
   */
  sensitive: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      strapi.log.debug(`[SENSITIVE] ${message}`, data);
    } else {
      // 生产环境只记录操作，不记录敏感数据
      strapi.log.info(message.replace(/:\s.*$/, '')); // 移除冒号后的数据
    }
  },

  /**
   * 信息日志（生产环境可见）
   */
  info: (message: string) => {
    strapi.log.info(message);
  },

  /**
   * 警告日志
   */
  warn: (message: string, data?: any) => {
    strapi.log.warn(message, data);
  },

  /**
   * 错误日志（始终记录完整信息）
   */
  error: (message: string, error: any) => {
    strapi.log.error(message, error);
  },
};
```

**Step 2: 更新订阅控制器日志**

```typescript
// backend/src/api/subscriber/controllers/subscriber.ts

import { logger } from '../../../utils/logger';

export default {
  async subscribe(ctx: any) {
    try {
      // ... 业务逻辑

      // ❌ 修改前
      // strapi.log.info(`Generated token for ${email}: ${subscriber.confirmationToken}`);
      // strapi.log.info(`Confirmation URL: ${confirmationUrl}`);

      // ✅ 修改后
      logger.sensitive(`Generated token for ${email}:`, subscriber.confirmationToken);
      logger.sensitive(`Confirmation URL:`, confirmationUrl);
      logger.info(`Confirmation email sent to ${email}`);

    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
      // ...
    }
  },

  async confirm(ctx: any) {
    try {
      const { token } = ctx.query;

      // ❌ 修改前
      // strapi.log.info(`Confirming subscription with token: ${token}`);
      // strapi.log.info(`Subscriber found: ${subscriber ? 'Yes' : 'No'}`);
      // strapi.log.info(`Subscriber details: ${JSON.stringify({...})}`);

      // ✅ 修改后
      logger.dev('Confirming subscription', { tokenLength: token?.length });

      const subscriber = await strapi.db.query('api::subscriber.subscriber').findOne({
        where: { confirmationToken: token },
      });

      logger.dev('Subscriber lookup result', {
        found: !!subscriber,
        status: subscriber?.status,
      });

      if (!subscriber) {
        logger.warn(`Invalid confirmation token attempt from IP: ${ctx.ip}`);
        return ctx.notFound('Invalid confirmation token');
      }

      // ... 确认逻辑

      logger.info(`Subscription confirmed for ${subscriber.email}`);

    } catch (error) {
      logger.error('Confirm subscription error:', error);
      return ctx.internalServerError('Confirmation failed.');
    }
  },
};
```

**Step 3: 添加日志级别环境变量**

```env
# .env.local (开发环境)
NODE_ENV=development
LOG_LEVEL=debug

# .env.production (生产环境)
NODE_ENV=production
LOG_LEVEL=info
```

#### 验收标准
- [x] 生产环境不输出敏感信息（token、URL） ✅
- [x] 开发环境保留详细调试信息 ✅
- [x] 错误日志始终包含完整堆栈 ✅
- [x] 日志输出结构化、易于搜索 ✅

**✅ 已完成** (2025-11-05)
- 创建了环境感知的日志工具 `logger.ts`
- 实现了 `dev()`, `sensitive()`, `info()`, `warn()`, `error()` 方法
- 更新了 `email-service.ts` 使用新的日志工具
- 敏感信息(token、URL)仅在开发环境显示
- 生产环境日志清晰简洁

#### 相关文件
- `backend/src/utils/logger.ts` ✅ (已创建)
- `backend/src/api/subscriber/services/email-service.ts` ✅ (已更新)
- `backend/src/api/subscriber/controllers/subscriber.ts` ✅ (已导入 logger)

---

## 📈 进度追踪

### 本周目标（Week 1）
- [x] Task 1: 启用 TypeScript Strict 模式 (P0) ✅ **已完成**
- [x] Task 2: 修复 SSL 配置 (P1) ✅ **已完成**
- [x] Task 3: 修复邮件失败回滚逻辑 (P1) ✅ **已完成**
- [x] Task 4: 配置化硬编码 URL (P1) ✅ **已完成**

### 下周目标（Week 2）
- [x] Task 5: 改进环境变量示例 (P1) ✅ **已完成**
- [x] Task 6: CORS 精确配置 (P1) ✅ **已完成**
- [x] Task 7: 重构订阅控制器 (P2) ✅ **已完成**
- [ ] Task 8: 添加速率限制 (P2) ⏳ **待开始** (需要 Redis)

### 月度目标（Month 1）
- [x] Task 9: 优化日志 (P3) ✅ **已完成**
- [ ] 所有 P0-P2 任务完成 (进度: 7/8 - Task 8 需 Redis 基础设施)
- [x] 代码审查和测试 ✅ **已完成** (22 个集成测试通过)

### 额外完成的工作
- [x] **测试模块开发** ✅ **已完成** (2025-11-05)
  - 创建了完整的测试基础设施 (Jest + Supertest + TypeScript)
  - 覆盖所有公开 API 端点:
    - Subscriber API: 13 tests ✅
    - Article API: 7 tests ✅
    - Health API: 3 tests ✅
  - 总计: 22/22 tests passed
  - 测试文档: `tests/README.md`
  - TypeScript 类型支持: `tsconfig.test.json` + triple-slash directives

---

## 📚 参考资源

### Strapi 文档
- [Security Best Practices](https://docs.strapi.io/dev-docs/security)
- [Middlewares](https://docs.strapi.io/dev-docs/configurations/middlewares)
- [Database Configuration](https://docs.strapi.io/dev-docs/configurations/database)

### TypeScript 配置
- [TSConfig Reference](https://www.typescriptlang.org/tsconfig)
- [Strict Mode Guide](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#strictness)

### 安全资源
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**文档版本**: 1.2
**最后更新**: 2025-11-05
**维护者**: Backend Team
**已完成任务**: 8/9 (Task 1, 2, 3, 4, 5, 6, 7, 9 + 测试模块)
**待完成任务**: 1/9 (Task 8 - 需要 Redis 基础设施支持)
