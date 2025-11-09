# 前端任务清单 (Frontend TODO)

**项目**: lizizai-blog Frontend (Next.js)
**更新时间**: 2025-11-03
**总任务数**: 7 个
**预计总工作量**: ~4 天

---

## 📋 任务概览

| 优先级 | 任务数 | 预计工作量 | 状态 |
|--------|--------|-----------|------|
| P1 重要 | 3 | 4.5 小时 | ⏳ 待开始 |
| P2 改进 | 3 | 3.5 天 | ⏳ 待开始 |
| P3 优化 | 1 | 2 小时 | ⏳ 待开始 |

---

## 🟠 P1 - 重要问题（本周内完成）

### ✅ Task 1: 添加 GraphQL 错误边界

**优先级**: P1
**预计工作量**: 2 小时
**影响范围**: 整个应用的稳定性
**负责人**: _待分配_

#### 问题描述
- **位置**: `frontend/lib/graphql/queries.ts` 和 `frontend/lib/apollo-client.ts`
- **问题**: GraphQL 查询无全局错误处理机制
- **风险**: GraphQL 错误可能导致页面崩溃或白屏

#### 修复步骤

**Step 1: 创建错误处理链接**

```typescript
// frontend/lib/graphql/error-link.ts
import { onError } from '@apollo/client/link/error';
import { Observable } from '@apollo/client';

export const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // GraphQL 错误处理
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL Error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
      );

      // 根据错误类型进行不同处理
      if (extensions?.code === 'UNAUTHENTICATED') {
        console.warn('User is not authenticated');
        // 可以重定向到登录页或刷新 token
      }

      if (extensions?.code === 'FORBIDDEN') {
        console.warn('Access forbidden');
        // 显示权限错误提示
      }
    });

    // 可选：使用 toast 显示用户友好的错误消息
    if (typeof window !== 'undefined') {
      const errorMessage = graphQLErrors[0]?.message || 'An error occurred';
      // 集成你的 toast 库
      // toast.error(errorMessage);
    }
  }

  // 网络错误处理
  if (networkError) {
    console.error(`[Network Error]: ${networkError}`);

    if (typeof window !== 'undefined') {
      // 检查网络连接
      if (!navigator.onLine) {
        console.error('You are offline. Please check your internet connection.');
        // toast.error('You are offline');
      } else {
        console.error('Network error occurred. Please try again.');
        // toast.error('Network error occurred');
      }
    }
  }

  // 重试逻辑（可选）
  // return new Observable(observer => {
  //   forward(operation).subscribe({
  //     next: observer.next.bind(observer),
  //     error: observer.error.bind(observer),
  //     complete: observer.complete.bind(observer),
  //   });
  // });
});
```

**Step 2: 更新 Apollo Client 配置**

```typescript
// frontend/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { errorLink } from './graphql/error-link';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/graphql',
  credentials: 'same-origin',
});

const client = new ApolloClient({
  // ✅ 组合错误处理链接和 HTTP 链接
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          articles: {
            // 分页合并策略
            keyArgs: ['filters', 'sort'],
            merge(existing, incoming, { args }) {
              if (!existing || args?.pagination?.start === 0) {
                return incoming;
              }
              return {
                ...incoming,
                data: [...existing.data, ...incoming.data],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all', // 返回部分数据 + 错误
      fetchPolicy: 'cache-and-network',
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'network-only',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;
```

**Step 3: 添加查询级别的错误处理（可选）**

```typescript
// frontend/app/page.tsx (示例)
'use client';

import { useQuery } from '@apollo/client';
import { GET_ARTICLES } from '@/lib/graphql/queries';

export default function HomePage() {
  const { data, loading, error } = useQuery(GET_ARTICLES, {
    variables: { limit: 10, start: 0 },
    // ✅ 组件级错误处理
    onError: (error) => {
      console.error('Failed to load articles:', error);
      // 可以设置本地错误状态
    },
  });

  // ✅ 显示错误 UI
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Failed to load articles
          </h2>
          <p className="text-muted-foreground mb-4">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* 渲染文章列表 */}
    </div>
  );
}
```

#### 验收标准
- [ ] Apollo Client 配置 error link
- [ ] GraphQL 错误在控制台清晰显示
- [ ] 网络错误有友好提示
- [ ] 页面不会因 GraphQL 错误崩溃
- [ ] 保留部分数据显示能力（errorPolicy: 'all'）

#### 相关文件
- `frontend/lib/graphql/error-link.ts` (新建)
- `frontend/lib/apollo-client.ts`
- 所有使用 `useQuery` 的组件

---

### ✅ Task 2: 配置化硬编码 URL

**优先级**: P1
**预计工作量**: 30 分钟
**影响范围**: 邮件模板和链接生成
**负责人**: _待分配_

#### 问题描述
- **位置**: `frontend/app/api/subscribe/route.ts:141, 149-153`
- **问题**: 欢迎邮件 HTML 模板中多处硬编码 `https://lizizai.xyz`
- **影响**: 无法在不同环境使用不同域名

#### 修复步骤

**Step 1: 添加环境变量**

```env
# frontend/.env.local (开发环境)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# frontend/.env.production (生产环境)
NEXT_PUBLIC_SITE_URL=https://lizizai.xyz
NEXT_PUBLIC_STRAPI_URL=https://lizizai-blog.onrender.com

# frontend/.env.example
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337/api
```

**Step 2: 提取邮件模板到独立文件**

```typescript
// frontend/lib/email-templates.ts

/**
 * 生成欢迎邮件 HTML
 */
export function getWelcomeEmailHTML(name: string): string {
  const displayName = name || 'there';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lizizai.xyz';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* 保持原有样式 */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to future/proof!</h1>
      <p>You're now part of something special</p>
    </div>

    <div class="content">
      <p>Hi <strong>${displayName}</strong>,</p>

      <p>Thank you for subscribing to <strong>future/proof</strong>!</p>

      <center>
        <a href="${siteUrl}" class="button">Visit Our Website</a>
      </center>

      <p>Stay curious and keep building,<br>
      <strong>The future/proof Team</strong></p>
    </div>

    <div class="footer">
      <p>You're receiving this email because you subscribed at <a href="${siteUrl}">${siteUrl}</a></p>
      <p style="margin-top: 16px;">
        <a href="${siteUrl}">Visit Website</a> ·
        <a href="${siteUrl}/privacy">Privacy Policy</a> ·
        <a href="${siteUrl}/unsubscribe">Unsubscribe</a>
      </p>
      <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">
        © 2025 future/proof. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 生成确认邮件 HTML
 */
export function getConfirmationEmailHTML(name: string, confirmationUrl: string): string {
  const displayName = name || 'there';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lizizai.xyz';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    /* 样式定义 */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirm Your Subscription</h1>
    </div>

    <div class="content">
      <p>Hi <strong>${displayName}</strong>,</p>

      <p>Thank you for subscribing to future/proof! Please confirm your email address by clicking the button below:</p>

      <center>
        <a href="${confirmationUrl}" class="button">Confirm Subscription</a>
      </center>

      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${confirmationUrl}</p>

      <p><small>This link will expire in 24 hours.</small></p>
    </div>

    <div class="footer">
      <p>If you didn't request this, please ignore this email.</p>
      <p><a href="${siteUrl}">Visit Website</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Step 3: 更新订阅路由**

```typescript
// frontend/app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, getWelcomeEmailHTML } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    // 验证邮箱
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: { message: 'Invalid email address' } },
        { status: 400 }
      );
    }

    // 调用后端 API
    const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(`${backendUrl}/api/subscribers/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          name: name || '',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);

      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: { message: 'Request timeout. Please try again.' } },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: { message: 'Network error. Please check your connection and try again.' } },
        { status: 503 }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return NextResponse.json(
        { error: { message: 'Invalid response from server.' } },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: { message: data.error?.message || 'Subscription failed' } },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: data.message || 'Please check your email to confirm your subscription.',
      requiresConfirmation: data.requiresConfirmation,
      subscriber: data.subscriber,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: { message: 'Subscription failed. Please try again later.' } },
      { status: 500 }
    );
  }
}
```

#### 验收标准
- [ ] 环境变量在所有 `.env` 文件中配置
- [ ] 邮件模板使用环境变量
- [ ] 提取邮件模板到独立文件
- [ ] 不同环境测试通过

#### 相关文件
- `frontend/lib/email-templates.ts` (新建)
- `frontend/app/api/subscribe/route.ts`
- `frontend/.env.local`
- `frontend/.env.production`
- `frontend/.env.example`

---

### ✅ Task 3: 添加环境变量运行时验证

**优先级**: P1
**预计工作量**: 2 小时
**影响范围**: 应用配置安全性
**负责人**: _待分配_

#### 问题描述
- **位置**: 整个前端项目
- **问题**: 直接使用 `process.env.*`，缺乏类型安全和运行时验证
- **风险**: 配置错误可能在运行时才被发现

#### 修复步骤

**Step 1: 安装依赖（如未安装）**

```bash
# zod 已在 package.json 中
pnpm install
```

**Step 2: 创建环境变量验证模块**

```typescript
// frontend/lib/env.ts
import { z } from 'zod';

/**
 * 环境变量 schema 定义
 */
const envSchema = z.object({
  // Next.js 公开环境变量
  NEXT_PUBLIC_SITE_URL: z.string().url().describe('网站前端 URL'),
  NEXT_PUBLIC_STRAPI_URL: z.string().url().describe('Strapi 后端 URL'),
  NEXT_PUBLIC_STRAPI_API_URL: z.string().url().describe('Strapi API URL'),

  // 服务器端环境变量（可选）
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
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
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
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
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  strapiUrl: env.NEXT_PUBLIC_STRAPI_URL,
  strapiApiUrl: env.NEXT_PUBLIC_STRAPI_API_URL,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;
```

**Step 3: 更新现有代码使用新的 env**

```typescript
// ❌ 修改前
const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';

// ✅ 修改后
import { config } from '@/lib/env';
const API_URL = config.strapiApiUrl;
```

**示例：更新 API 客户端**

```typescript
// frontend/lib/api.ts
import { config } from '@/lib/env';

const API_URL = config.strapiApiUrl;

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { params, ...fetchOptions } = options;

  let url = `${API_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // ... API 方法
};
```

**Step 4: 在应用启动时验证（可选）**

```typescript
// frontend/app/layout.tsx
import { config } from '@/lib/env';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 开发环境下显示配置信息
  if (config.isDevelopment && typeof window !== 'undefined') {
    console.log('🔧 Environment Configuration:', {
      siteUrl: config.siteUrl,
      strapiUrl: config.strapiUrl,
      environment: process.env.NODE_ENV,
    });
  }

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### 验收标准
- [ ] `lib/env.ts` 创建并验证所有环境变量
- [ ] 所有 `process.env.*` 调用替换为 `config.*`
- [ ] 缺少环境变量时应用启动失败（有清晰错误提示）
- [ ] TypeScript 提供完整的类型提示
- [ ] 构建时验证环境变量

#### 测试方法

```bash
# 测试：删除一个必需的环境变量
# .env.local 中注释掉 NEXT_PUBLIC_STRAPI_URL

pnpm dev
# 应该看到清晰的错误提示：
# ❌ Environment variable validation failed:
#   - NEXT_PUBLIC_STRAPI_URL: Required
```

#### 相关文件
- `frontend/lib/env.ts` (新建)
- `frontend/lib/api.ts`
- `frontend/lib/apollo-client.ts`
- `frontend/lib/strapi.ts`
- `frontend/app/api/subscribe/route.ts`
- 所有使用 `process.env` 的文件

---

## 🟡 P2 - 改进建议（2周内完成）

### ✅ Task 4: 重构订阅 API 路由（应用 KISS 原则）

**优先级**: P2
**预计工作量**: 1 天
**影响范围**: 代码可维护性
**负责人**: _待分配_

#### 问题描述
- **位置**: `frontend/app/api/subscribe/route.ts`
- **问题**: 246 行单文件，混合验证、网络请求、错误处理、HTML 模板
- **违反原则**: KISS（简单至上）、单一职责原则

#### 重构方案

**Step 1: 提取验证逻辑**

```typescript
// frontend/lib/validators/subscribe-validator.ts
import { z } from 'zod';

export const subscribeInputSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .transform(val => val.trim()),
  name: z
    .string()
    .optional()
    .transform(val => val?.trim() || ''),
});

export type SubscribeInput = z.infer<typeof subscribeInputSchema>;

/**
 * 验证订阅输入
 */
export function validateSubscribeInput(body: unknown): SubscribeInput {
  try {
    return subscribeInputSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new Error(firstError.message);
    }
    throw new Error('Invalid input');
  }
}
```

**Step 2: 提取后端 API 调用**

```typescript
// frontend/lib/backend-api.ts
import { config } from './env';

const BACKEND_TIMEOUT = 30000; // 30 seconds

export class BackendAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'BackendAPIError';
  }
}

/**
 * 调用后端订阅 API
 */
export async function createSubscription(
  email: string,
  name: string
): Promise<{
  message: string;
  requiresConfirmation?: boolean;
  subscriber?: { email: string; name: string };
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

  try {
    const response = await fetch(`${config.strapiUrl}/api/subscribers/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new BackendAPIError('Invalid response from server', 500, jsonError);
    }

    if (!response.ok) {
      throw new BackendAPIError(
        data.error?.message || 'Subscription failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof BackendAPIError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new BackendAPIError('Request timeout. Please try again.', 504);
    }

    throw new BackendAPIError(
      'Network error. Please check your connection and try again.',
      503,
      error
    );
  }
}

/**
 * 确认订阅
 */
export async function confirmSubscription(token: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

  try {
    const response = await fetch(
      `${config.strapiUrl}/api/subscribers/confirm?token=${token}`,
      {
        method: 'GET',
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new BackendAPIError(
        data.error?.message || 'Confirmation failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof BackendAPIError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new BackendAPIError('Request timeout. Please try again.', 504);
    }

    throw new BackendAPIError('Network error occurred', 503, error);
  }
}
```

**Step 3: 简化 API 路由**

```typescript
// frontend/app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateSubscribeInput } from '@/lib/validators/subscribe-validator';
import { createSubscription, BackendAPIError } from '@/lib/backend-api';

/**
 * 订阅 API 路由
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析和验证输入
    const body = await request.json();
    const input = validateSubscribeInput(body);

    // 2. 调用后端 API
    const result = await createSubscription(input.email, input.name);

    // 3. 返回成功响应
    return NextResponse.json(result);
  } catch (error) {
    // 4. 统一错误处理
    if (error instanceof BackendAPIError) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: error.statusCode }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 400 }
      );
    }

    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: { message: 'Subscription failed. Please try again later.' } },
      { status: 500 }
    );
  }
}
```

**Step 4: 简化确认路由**

```typescript
// frontend/app/api/subscribe/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { confirmSubscription, BackendAPIError } from '@/lib/backend-api';

/**
 * 确认订阅 API 路由
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: { message: 'Confirmation token is required' } },
        { status: 400 }
      );
    }

    const result = await confirmSubscription(token);

    // 重定向到成功页面
    return NextResponse.redirect(new URL('/subscribe?confirmed=true', request.url));
  } catch (error) {
    if (error instanceof BackendAPIError) {
      return NextResponse.redirect(
        new URL(`/subscribe?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    console.error('Confirm error:', error);
    return NextResponse.redirect(
      new URL('/subscribe?error=Confirmation failed', request.url)
    );
  }
}
```

#### 验收标准
- [ ] 验证逻辑独立可测试
- [ ] API 调用逻辑复用性强
- [ ] 路由文件平均长度 < 50 行
- [ ] 错误处理统一且清晰
- [ ] 所有原有功能正常运行

#### 重构效果对比

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| `route.ts` 行数 | 246 | ~40 |
| 函数圈复杂度 | ~8 | ~3 |
| 可测试性 | 低 | 高 |
| 代码复用 | 无 | 高 |

#### 相关文件
- `frontend/app/api/subscribe/route.ts` (重构)
- `frontend/app/api/subscribe/confirm/route.ts` (重构)
- `frontend/lib/validators/subscribe-validator.ts` (新建)
- `frontend/lib/backend-api.ts` (新建)
- `frontend/lib/email-templates.ts` (已在 Task 2 创建)

---

### ✅ Task 5: 删除未使用的 GraphQL Mutation

**优先级**: P2
**预计工作量**: 15 分钟
**影响范围**: 代码清洁度
**负责人**: _待分配_

#### 问题描述
- **位置**: `frontend/lib/graphql/queries.ts:136-148`
- **问题**: `SUBSCRIBE_NEWSLETTER` mutation 定义但从未使用
- **影响**: 代码冗余，增加维护负担

#### 修复步骤

**Step 1: 确认未使用**

```bash
# 在项目中搜索使用情况
cd frontend
grep -r "SUBSCRIBE_NEWSLETTER" --include="*.ts" --include="*.tsx"
```

**Step 2: 删除未使用的代码**

```typescript
// frontend/lib/graphql/queries.ts

// ❌ 删除以下代码（136-148 行）
export const SUBSCRIBE_NEWSLETTER = gql`
  mutation SubscribeNewsletter($email: String!) {
    createNewsletter(data: { email: $email, status: "active" }) {
      data {
        id
        attributes {
          email
          status
        }
      }
    }
  }
`;

// ❌ 同时删除 INCREMENT_ARTICLE_LIKES（如果未使用）
export const INCREMENT_ARTICLE_LIKES = gql`
  mutation IncrementArticleLikes($id: ID!, $likes: Int!) {
    updateArticle(id: $id, data: { likes: $likes }) {
      data {
        id
        attributes {
          likes
        }
      }
    }
  }
`;
```

**Step 3: 验证构建**

```bash
pnpm build
# 确保没有引用错误
```

#### 验收标准
- [ ] 删除未使用的 GraphQL mutation
- [ ] 代码搜索确认无引用
- [ ] 构建成功无错误
- [ ] 减少文件大小和复杂度

#### 相关文件
- `frontend/lib/graphql/queries.ts`

---

### ✅ Task 6: 实现 TODO 标记的功能

**优先级**: P2
**预计工作量**: 2.5 天（分享 4 小时 + 评论 2 天）
**影响范围**: 用户体验
**负责人**: _待分配_

#### 问题描述
- **位置**:
  - `frontend/components/article/ArticleCard.tsx:156` - 评论功能
  - `frontend/components/article/ArticleCard.tsx:168` - 分享功能
- **问题**: 按钮存在但功能未实现
- **影响**: 用户点击无响应，体验不佳

#### 子任务 6.1: 实现分享功能

**预计工作量**: 4 小时

```typescript
// frontend/lib/utils/share.ts

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
  // 优先使用 Web Share API
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
 * 社交媒体分享 URL
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
};
```

**更新 ArticleCard 组件**:

```typescript
// frontend/components/article/ArticleCard.tsx

import { shareContent, socialShare } from '@/lib/utils/share';
import { config } from '@/lib/env';

export default function ArticleCard({ article }: ArticleCardProps) {
  // ... 现有状态

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${config.siteUrl}/article/${slug}`;
    const shareData = {
      title: title,
      text: subtitle || title,
      url: shareUrl,
    };

    const success = await shareContent(shareData);

    if (success) {
      // 可选：显示成功提示
      // toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Card>
      {/* ... 其他内容 */}

      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={handleShare}
      >
        <Share2 className="h-3.5 w-3.5" />
      </Button>
    </Card>
  );
}
```

#### 子任务 6.2: 实现评论功能

**预计工作量**: 2 天

这是一个较大的功能，需要：
1. 后端 API（已有 comment 内容类型）
2. 前端评论组件
3. 评论列表和表单

**简化方案（可选）**：
- 集成第三方评论系统（如 Disqus, Giscus）
- 预计工作量：4 小时

```typescript
// frontend/components/article/Comments.tsx
'use client';

import Giscus from '@giscus/react';
import { useTheme } from 'next-themes';

interface CommentsProps {
  articleId: string;
  articleTitle: string;
}

export default function Comments({ articleId, articleTitle }: CommentsProps) {
  const { theme } = useTheme();

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Comments</h2>
      <Giscus
        repo="your-github-username/your-repo" // 配置你的 GitHub 仓库
        repoId="your-repo-id"
        category="Comments"
        categoryId="your-category-id"
        mapping="specific"
        term={articleId}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme === 'dark' ? 'dark' : 'light'}
        lang="en"
        loading="lazy"
      />
    </div>
  );
}
```

**更新 ArticleCard**:

```typescript
const handleComment = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  // 跳转到文章页面的评论区
  window.location.href = `/article/${slug}#comments`;
};

<Button
  variant="ghost"
  size="sm"
  className="h-8 gap-1.5 text-xs"
  onClick={handleComment}
>
  <MessageCircle className="h-3.5 w-3.5" />
  <span>{commentsCount}</span>
</Button>
```

#### 验收标准

**分享功能**:
- [ ] 支持原生分享（移动设备）
- [ ] 降级到复制链接（桌面设备）
- [ ] 显示分享成功提示
- [ ] 各平台测试通过

**评论功能**:
- [ ] 评论组件集成
- [ ] 评论按钮跳转到评论区
- [ ] 评论数显示正确
- [ ] 响应式设计

#### 相关文件
- `frontend/lib/utils/share.ts` (新建)
- `frontend/components/article/Comments.tsx` (新建)
- `frontend/components/article/ArticleCard.tsx`
- `frontend/app/article/[slug]/page.tsx`

---

## 🟢 P3 - 优化建议（1月内完成）

### ✅ Task 7: 添加 React Error Boundary

**优先级**: P3
**预计工作量**: 2 小时
**影响范围**: 应用稳定性
**负责人**: _待分配_

#### 问题描述
- **位置**: 前端应用根组件
- **问题**: 组件错误会导致整个应用白屏
- **风险**: 用户体验差，无法优雅降级

#### 修复步骤

**Step 1: 创建 Error Boundary 组件**

```typescript
// frontend/components/ErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到日志服务
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // 可选：发送到错误追踪服务（如 Sentry）
    // if (typeof window !== 'undefined') {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback 或默认错误 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * 默认错误显示组件
 */
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again or contact support if the problem
            persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-mono text-destructive mb-2">{error.message}</p>
              <pre className="text-xs overflow-auto max-h-40">{error.stack}</pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onReset} variant="default">
              Try Again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: 在 Layout 中应用**

```typescript
// frontend/app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Step 3: 页面级 Error Boundary（可选）**

```typescript
// frontend/app/article/[slug]/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误
    console.error('Article page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h2 className="text-2xl font-bold mb-4">Failed to load article</h2>
      <p className="text-muted-foreground mb-6">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
```

**Step 4: 集成错误追踪（可选）**

```bash
# 安装 Sentry
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 1.0,
});
```

#### 验收标准
- [ ] Error Boundary 组件创建
- [ ] 根 Layout 应用 Error Boundary
- [ ] 错误时显示友好 UI
- [ ] 开发环境显示详细错误信息
- [ ] 生产环境隐藏技术细节
- [ ] 提供"重试"和"返回首页"选项

#### 测试方法

```typescript
// 创建测试组件触发错误
'use client';

export default function TestError() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error boundary');
  }

  return (
    <button onClick={() => setShouldError(true)}>
      Trigger Error
    </button>
  );
}
```

#### 相关文件
- `frontend/components/ErrorBoundary.tsx` (新建)
- `frontend/app/layout.tsx`
- `frontend/app/article/[slug]/error.tsx` (新建)
- `sentry.client.config.ts` (可选)

---

## 📈 进度追踪

### 本周目标（Week 1）
- [ ] Task 1: GraphQL 错误边界 (P1) - 2 小时
- [ ] Task 2: 配置化硬编码 URL (P1) - 30 分钟
- [ ] Task 3: 环境变量验证 (P1) - 2 小时

### 下周目标（Week 2）
- [ ] Task 4: 重构订阅路由 (P2) - 1 天
- [ ] Task 5: 删除未使用代码 (P2) - 15 分钟
- [ ] Task 6.1: 实现分享功能 (P2) - 4 小时

### 月度目标（Month 1）
- [ ] Task 6.2: 实现评论功能 (P2) - 2 天
- [ ] Task 7: Error Boundary (P3) - 2 小时
- [ ] 所有 P1-P2 任务完成
- [ ] 代码审查和测试

---

## 📚 参考资源

### Next.js 文档
- [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

### Apollo Client
- [Error Handling](https://www.apollographql.com/docs/react/data/error-handling/)
- [Link Composition](https://www.apollographql.com/docs/react/api/link/introduction/)

### 最佳实践
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Zod Validation](https://zod.dev/)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)

---

**文档版本**: 1.0
**最后更新**: 2025-11-03
**维护者**: Frontend Team
