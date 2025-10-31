# Bug 修复总结

## 🔍 问题诊断

### 核心问题
1. **文章详情页 404 错误** - 所有文章详情页无法访问
2. **React Hydration 错误** - 首页出现 Minified React error #418
3. **日期显示异常** - 所有文章日期显示为 "Dec 31, 1969"

### 根本原因
**Strapi v5 Draft & Publish 配置问题**

- 文章虽然在管理界面显示为 "Published"，但数据库中的 `publishedAt` 字段为 `null`
- Strapi API 默认只返回 `publishedAt` 不为 null 的文章
- 禁用 Draft & Publish 后，现有文章的 `publishedAt` 不会自动更新

## ✅ 已完成的修复

### 1. 禁用 Draft & Publish 功能
**文件:** `backend/src/api/article/content-types/article/schema.json`

```json
{
  "options": {
    "draftAndPublish": false  // 从 true 改为 false
  }
}
```

**效果:**
- ✅ 简化内容管理流程
- ✅ 新文章会自动设置 `publishedAt`
- ❌ 现有文章的 `publishedAt` 仍然是 null（需要手动更新）

### 2. 环境变量标准化
**文档:** `ENV_VARIABLES_STANDARDIZATION.md`

统一使用以下环境变量：
- `NEXT_PUBLIC_STRAPI_URL` - Strapi 基础 URL
- `RESEND_API_KEY` - Resend 邮件服务 API Key

**Vercel 配置:**
```
NEXT_PUBLIC_STRAPI_URL=https://lizizai-blog.onrender.com
RESEND_API_KEY=re_6Vhy7ZyZ_C7HEdztmpwtXt6A4fozttr2G
```

## ⚠️ 待解决的问题

### 核心问题：现有文章的 publishedAt 为 null

**影响:**
- ✅ 首页可以显示文章列表（因为使用了 `populate=*`）
- ❌ 文章详情页返回 404（过滤查询返回空结果）
- ❌ 所有日期显示为 "Dec 31, 1969"

**测试结果:**
```bash
# 不带过滤器 - 返回空
curl "https://lizizai-blog.onrender.com/api/articles"
# 返回: []

# 带 populate=* - 返回数据
curl "https://lizizai-blog.onrender.com/api/articles?populate=*"
# 返回: [8篇文章，但 publishedAt 都是 null]

# 带 slug 过滤器 - 返回空
curl "https://lizizai-blog.onrender.com/api/articles?filters[slug][\$eq]=dopamine-detox-reset-life-30-days"
# 返回: []
```

## 🔧 解决方案

### 方案 A：手动更新 Strapi 中的文章（推荐）

**步骤:**
1. 登录 Strapi 管理面板：https://lizizai-blog.onrender.com/admin
   - Email: liancheng.ly@gmail.com
   - Password: rhMc^X2Gi5

2. 进入 Content Manager → Article

3. 逐个打开每篇文章，点击 "Save" 按钮
   - 这会触发 Strapi 自动设置 `publishedAt` 为当前时间

4. 保存所有 8 篇文章后，API 应该能正常返回数据

**优点:**
- ✅ 彻底解决问题
- ✅ 不需要修改代码
- ✅ 符合 Strapi 的设计理念

**缺点:**
- ❌ 需要手动操作（8篇文章）
- ❌ 耗时约 5-10 分钟

### 方案 B：修改前端代码适配 null publishedAt

**修改文件:** `frontend/lib/strapi.ts`

在 `getArticleBySlug` 和其他查询函数中添加 `status=*` 参数：

```typescript
export async function getArticleBySlug(slug: string) {
  const data = await fetchAPI('/articles', {}, {
    'filters[slug][$eq]': slug,
    'status': '*',  // 添加这一行，获取所有状态的文章
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'populate[comments][populate][0]': 'replies',
  });

  const articles = transformStrapiResponse(data);
  return Array.isArray(articles) && articles.length > 0 ? articles[0] : null;
}
```

**优点:**
- ✅ 快速修复
- ✅ 不需要手动操作 Strapi

**缺点:**
- ❌ 临时解决方案
- ❌ 可能导致其他问题（根据 GitHub Issue #23643，`status=*` 会导致 `publishedAt` 返回 null）

### 方案 C：通过 API 批量更新（需要调试）

**脚本:** `/home/ubuntu/fix_articles_published_at.js`

当前问题：Strapi 管理员登录 API 返回 400 Bad Request

需要调试：
- 确认正确的登录 API 端点
- 或使用 API Token 代替登录

## 📝 建议的行动计划

1. **立即执行：** 使用方案 A 手动更新所有文章（5-10分钟）
2. **验证修复：** 测试文章详情页是否能正常访问
3. **继续重构：** 完成第二阶段的功能模块重构

## 📊 当前状态

| 功能 | 状态 | 备注 |
| :--- | :--- | :--- |
| 首页文章列表 | ✅ 正常 | 可以显示所有文章 |
| 文章详情页 | ❌ 404 | publishedAt 为 null |
| 日期显示 | ❌ 异常 | 显示为 1969-12-31 |
| 点赞功能 | ✅ 正常 | 显示点赞数 |
| 导航菜单 | ✅ 正常 | 已移除 Chat 链接 |
| 认证系统 | ✅ 已移除 | 完成重构 |

## 🔗 相关资源

- [Strapi v5 Draft & Publish Issue #23643](https://github.com/strapi/strapi/issues/23643)
- [Strapi 管理面板](https://lizizai-blog.onrender.com/admin)
- [前端部署](https://lizizai.xyz/)
- [后端部署](https://lizizai-blog.onrender.com)
