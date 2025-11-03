# 前端错误分析与修复计划

**分析日期：** 2025年11月3日  
**问题严重程度：** 🔴 高 - 核心功能无法使用

## 错误总结

根据控制台错误信息，发现了以下三类问题：

| 错误类型 | 数量 | 严重程度 | 影响功能 |
|---------|------|---------|---------|
| 404 页面缺失 | 多个 | 🟡 中 | 导航链接 |
| 403 点赞 API | 1 | 🔴 高 | 点赞功能 |
| ERR_CONNECTION_CLOSED | 1 | 🔴 高 | 订阅功能 |

---

## 问题 1: 点赞功能 - 403 Forbidden

### 错误信息
```
POST https://lizizai-blog.onrender.com/api/articles/1/like 403 (Forbidden)
Failed to like article: Error: API Error
```

### 症状
- 点击点赞按钮后数字短暂增加
- 随后恢复原状（因为 API 调用失败，前端回滚）

### 根本原因分析

**403 Forbidden** 错误通常由以下原因导致：

1. **Strapi 权限配置问题** ⭐ 最可能
   - 自定义路由 `/api/articles/:id/like` 没有配置公开访问权限
   - Strapi 默认所有 API 都需要认证

2. **CORS 配置不完整**
   - 虽然已添加域名，但可能缺少某些 headers
   - OPTIONS 预检请求可能被拒绝

3. **API 路由配置错误**
   - 自定义路由可能没有正确注册
   - 路由策略（policies）配置错误

### 修复计划

#### 步骤 1: 配置 Strapi 权限（最优先）

需要在 Strapi 中为自定义路由配置公开访问权限：

**方法 A: 通过管理后台配置**
1. 登录 Strapi 管理后台
2. Settings → Roles → Public
3. 找到 Article 的自定义权限
4. 勾选 `like` 权限

**方法 B: 通过代码配置（推荐）**

创建或更新路由配置文件，明确指定不需要认证：

```typescript
// backend/src/api/article/routes/custom-article.ts
export default {
  routes: [
    {
      method: 'POST',
      path: '/articles/:id/like',
      handler: 'article.like',
      config: {
        auth: false,  // ⭐ 关键：禁用认证
        policies: [],
        middlewares: [],
      },
    },
  ],
};
```

#### 步骤 2: 验证 CORS 配置

确保 CORS 配置包含所有必要的 headers：

```typescript
headers: [
  'Content-Type', 
  'Authorization', 
  'Origin', 
  'Accept',
  'X-Requested-With',  // 可能需要
],
```

#### 步骤 3: 检查路由注册

验证自定义路由是否正确加载：

```bash
# 在 Strapi 启动日志中查找
[INFO] Routes loaded: POST /api/articles/:id/like
```

---

## 问题 2: 订阅功能 - ERR_CONNECTION_CLOSED

### 错误信息
```
POST https://lizizai.xyz/api/subscribe net::ERR_CONNECTION_CLOSED
```

### 症状
- 点击订阅按钮后显示 "failed to fetch"
- 连接在发送请求时被关闭

### 根本原因分析

**ERR_CONNECTION_CLOSED** 表示连接在数据传输过程中被意外关闭，可能原因：

1. **前端 API 路由问题** ⭐ 最可能
   - `/api/subscribe` 是前端的 API 路由（Next.js API Route）
   - 该路由内部调用后端 Strapi API
   - 可能是前端 API 路由本身出错或超时

2. **后端 Strapi API 超时**
   - 发送邮件操作可能超时
   - Resend API 调用失败

3. **环境变量缺失**
   - `NEXT_PUBLIC_STRAPI_URL` 可能未正确配置
   - `RESEND_API_KEY` 可能未在前端环境变量中设置

### 修复计划

#### 步骤 1: 检查前端 API 路由

查看 `frontend/app/api/subscribe/route.ts` 的实现：

```typescript
// 当前实现
const backendUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://lizizai-blog.onrender.com';
const response = await fetch(`${backendUrl}/api/subscribers/subscribe`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: email.toLowerCase(),
    name: name || '',
  }),
});
```

**可能的问题：**
- 后端 `/api/subscribers/subscribe` 路由不存在或返回错误
- 超时时间过短
- 错误处理不当

#### 步骤 2: 添加超时和错误处理

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

try {
  const response = await fetch(`${backendUrl}/api/subscribers/subscribe`, {
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
  
  // ... 处理响应
} catch (error) {
  clearTimeout(timeoutId);
  console.error('Subscribe error:', error);
  
  if (error.name === 'AbortError') {
    return NextResponse.json(
      { error: { message: 'Request timeout. Please try again.' } },
      { status: 504 }
    );
  }
  
  return NextResponse.json(
    { error: { message: 'Network error. Please check your connection.' } },
    { status: 500 }
  );
}
```

#### 步骤 3: 验证后端订阅路由

检查后端是否正确实现了 `/api/subscribers/subscribe` 路由：

```bash
# 测试后端 API
curl -X POST https://lizizai-blog.onrender.com/api/subscribers/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

#### 步骤 4: 检查 Vercel 环境变量

确认 Vercel 前端环境变量已正确配置：
- `NEXT_PUBLIC_STRAPI_URL=https://lizizai-blog.onrender.com`
- `NEXT_PUBLIC_STRAPI_API_URL=https://lizizai-blog.onrender.com/api`

---

## 问题 3: 404 页面缺失（次要）

### 错误信息
```
GET https://lizizai.xyz/sitemap?_rsc=11fw1 404 (Not Found)
GET https://lizizai.xyz/collection-notice?_rsc=11fw1 404 (Not Found)
GET https://lizizai.xyz/terms?_rsc=11fw1 404 (Not Found)
GET https://lizizai.xyz/privacy?_rsc=11fw1 404 (Not Found)
GET https://lizizai.xyz/recommendations?_rsc=11fw1 404 (Not Found)
```

### 症状
- Footer 中的链接返回 404
- 不影响核心功能，但影响用户体验

### 根本原因
这些页面在前端项目中不存在，但 Footer 组件中有链接指向它们。

### 修复计划

#### 选项 A: 创建缺失的页面（推荐）

```bash
frontend/app/
  ├── sitemap/page.tsx
  ├── collection-notice/page.tsx
  ├── terms/page.tsx
  ├── privacy/page.tsx
  └── recommendations/page.tsx
```

#### 选项 B: 暂时移除或禁用链接

在 Footer 组件中注释掉或移除这些链接，直到页面创建完成。

#### 选项 C: 重定向到外部页面

如果这些内容托管在其他地方，可以使用外部链接。

---

## 修复优先级

### 🔴 P0 - 立即修复（阻塞功能）

1. **点赞功能 403 错误**
   - 配置 Strapi 自定义路由权限
   - 预计时间：15 分钟
   - 影响：点赞功能完全不可用

2. **订阅功能连接关闭**
   - 检查并修复前端 API 路由
   - 验证后端订阅端点
   - 预计时间：30 分钟
   - 影响：订阅功能完全不可用

### 🟡 P1 - 尽快修复（用户体验）

3. **404 页面缺失**
   - 创建基础页面或移除链接
   - 预计时间：1 小时
   - 影响：用户体验，但不影响核心功能

---

## 详细修复步骤

### 修复 1: 点赞功能 403

```bash
# 1. 更新自定义路由配置
# 文件: backend/src/api/article/routes/custom-article.ts

# 2. 重新构建和部署
cd backend
npm run build
git add .
git commit -m "fix: 配置点赞 API 公开访问权限"
git push origin main

# 3. 等待 Render 部署（3-5分钟）

# 4. 测试
curl -X POST https://lizizai-blog.onrender.com/api/articles/1/like \
  -H "Content-Type: application/json" \
  -d '{"visitorId":"test-visitor-123"}'
```

### 修复 2: 订阅功能连接关闭

```bash
# 1. 添加错误处理和超时
# 文件: frontend/app/api/subscribe/route.ts

# 2. 测试后端订阅端点
curl -X POST https://lizizai-blog.onrender.com/api/subscribers/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test"}'

# 3. 如果后端正常，更新前端代码
cd frontend
pnpm build

# 4. 提交并推送
git add .
git commit -m "fix: 改进订阅功能错误处理"
git push origin main

# 5. Vercel 自动部署（1-2分钟）
```

### 修复 3: 404 页面

```bash
# 1. 创建基础页面模板
# 或者暂时从 Footer 移除链接

# 2. 提交并推送
git add .
git commit -m "fix: 创建缺失的页面或移除无效链接"
git push origin main
```

---

## 验证清单

修复完成后，按以下顺序验证：

### 点赞功能
- [ ] 点击点赞按钮
- [ ] 验证数字增加且不回滚
- [ ] 刷新页面，点赞状态保持
- [ ] 检查浏览器控制台无 403 错误
- [ ] 检查数据库 `likes` 表有新记录

### 订阅功能
- [ ] 填写邮箱和姓名
- [ ] 点击订阅按钮
- [ ] 验证显示成功消息
- [ ] 检查浏览器控制台无连接错误
- [ ] 检查邮箱收到确认邮件
- [ ] 点击确认链接
- [ ] 验证订阅状态变为 active

### 页面导航
- [ ] 点击 Footer 中的每个链接
- [ ] 验证没有 404 错误
- [ ] 页面内容正确显示

---

## 监控和日志

### 前端日志（Vercel）
```bash
# 查看 Vercel 函数日志
vercel logs --follow
```

### 后端日志（Render）
```bash
# 在 Render Dashboard 查看实时日志
# 关注以下关键字：
# - "403"
# - "Forbidden"
# - "Permission denied"
# - "subscribe"
```

### 数据库查询
```sql
-- 检查点赞记录
SELECT * FROM likes ORDER BY created_at DESC LIMIT 10;

-- 检查订阅记录
SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 10;
```

---

## 预期结果

修复完成后：
1. ✅ 点赞功能正常工作，数字持久化
2. ✅ 订阅功能正常工作，发送确认邮件
3. ✅ 所有导航链接正常工作
4. ✅ 控制台无错误信息

---

*分析报告生成时间：2025年11月3日*  
*分析执行者：Manus AI*
