# 环境变量标准化方案

## 问题分析

当前项目中存在多个相似的环境变量，造成混淆：

### 前端代码中的使用情况
- `NEXT_PUBLIC_STRAPI_URL` - 在 `lib/strapi.ts` 中使用（Strapi 基础 URL）
- `NEXT_PUBLIC_STRAPI_API_URL` - 在 `lib/api.ts`、`app/api/subscribe/route.ts`、`components/layout/Footer.tsx` 中使用
- `NEXT_PUBLIC_STRAPI_GRAPHQL_URL` - 在 `lib/apollo-client.ts` 中使用

### Vercel 上的配置
- `NEXT_PUBLIC_STRAPI_URL` = https://lizizai-blog.onrender.com
- `NEXT_PUBLIC_STRAPI_API_URL` = https://lizizai-blog.onrender.com/api
- `NEXT_PUBLIC_API_URL` = https://lizizai-blog.onrender.com（冗余）
- `RESEND_API_KEY` = re_6Vhy7ZyZ_C7HEdztmpwtXt6A4fozttr2G

## 标准化方案

### 统一使用以下环境变量

| 变量名 | 用途 | 示例值 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_STRAPI_URL` | Strapi 基础 URL | `https://lizizai-blog.onrender.com` |
| `NEXT_PUBLIC_STRAPI_API_URL` | Strapi REST API URL | `https://lizizai-blog.onrender.com/api` |
| `NEXT_PUBLIC_STRAPI_GRAPHQL_URL` | Strapi GraphQL URL | `https://lizizai-blog.onrender.com/graphql` |
| `RESEND_API_KEY` | Resend 邮件服务 API Key | `re_xxx` |

### 需要删除的冗余变量
- ❌ `NEXT_PUBLIC_API_URL` - 与 `NEXT_PUBLIC_STRAPI_URL` 重复

## 代码修改计划

### 1. 统一 `lib/strapi.ts` 的逻辑
保持当前实现，从 `NEXT_PUBLIC_STRAPI_URL` 构建 API URL：
```typescript
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://lizizai-blog.onrender.com';
const STRAPI_API_URL = `${STRAPI_URL}/api`;
```

### 2. 更新其他文件使用统一的环境变量
- `lib/api.ts` - 使用 `NEXT_PUBLIC_STRAPI_API_URL`
- `app/api/subscribe/route.ts` - 使用 `NEXT_PUBLIC_STRAPI_API_URL`
- `components/layout/Footer.tsx` - 使用 `NEXT_PUBLIC_STRAPI_API_URL`
- `lib/apollo-client.ts` - 使用 `NEXT_PUBLIC_STRAPI_GRAPHQL_URL`

## 部署配置

### Vercel 环境变量（最终配置）
```
NEXT_PUBLIC_STRAPI_URL=https://lizizai-blog.onrender.com
RESEND_API_KEY=re_6Vhy7ZyZ_C7HEdztmpwtXt6A4fozttr2G
```

**注意：** 不需要单独设置 `NEXT_PUBLIC_STRAPI_API_URL`，因为代码会自动从 `NEXT_PUBLIC_STRAPI_URL` 构建。

### 本地开发 `.env.local`
```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
RESEND_API_KEY=re_6Vhy7ZyZ_C7HEdztmpwtXt6A4fozttr2G
```

## 实施步骤

1. ✅ 更新前端代码，统一环境变量使用
2. ✅ 在 Vercel 中删除 `NEXT_PUBLIC_API_URL` 和 `NEXT_PUBLIC_STRAPI_API_URL`
3. ✅ 确保 `NEXT_PUBLIC_STRAPI_URL` 正确设置
4. ✅ 重新部署并测试
