# 部署问题修复总结

**修复日期：** 2025年11月3日  
**问题类型：** Strapi 模型关联关系错误  
**严重程度：** 🔴 阻塞部署

## 问题描述

后端在 Render 部署时启动失败，错误信息：

```
Error: Error on attribute article in model like(api::like.like): 
inversedBy attribute articleLikes not found target api::article.article
```

## 根本原因

在创建 `Like` Content-Type 时，我定义了与 `Article` 的 `manyToOne` 关联关系，并指定了 `inversedBy: "articleLikes"`，但忘记在 `Article` schema 中添加对应的反向关联 `articleLikes`。

Strapi 要求双向关联必须在两个模型中都正确定义：
- `Like` → `Article` (manyToOne, inversedBy: "articleLikes")
- `Article` → `Like` (oneToMany, mappedBy: "article")

## 修复方案

### 1. 更新 Article Schema

**文件：** `backend/src/api/article/content-types/article/schema.json`

**添加的代码：**
```json
"articleLikes": {
  "type": "relation",
  "relation": "oneToMany",
  "target": "api::like.like",
  "mappedBy": "article"
}
```

这个字段定义了 `Article` 到 `Like` 的反向关联，允许从文章访问所有相关的点赞记录。

### 2. 重新生成 TypeScript 类型

```bash
npm run strapi ts:generate-types
```

这确保了 TypeScript 类型定义与新的 schema 同步。

### 3. 验证构建

```bash
npm run build
```

构建成功，没有错误。

## 修复后的关联关系

### Like Model
```json
{
  "article": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::article.article",
    "inversedBy": "articleLikes"  // 指向 Article 的 articleLikes 字段
  }
}
```

### Article Model
```json
{
  "articleLikes": {
    "type": "relation",
    "relation": "oneToMany",
    "target": "api::like.like",
    "mappedBy": "article"  // 映射到 Like 的 article 字段
  }
}
```

## 部署状态

- ✅ **本地构建成功**
- ✅ **代码已提交** (Commit: 270adbb)
- ✅ **已推送到 GitHub**
- ⏳ **等待 Render 自动部署**

## 验证步骤

部署完成后，需要验证以下功能：

1. **Strapi 启动成功**
   - 检查 Render 日志，确认没有关联错误
   - 访问 Strapi 管理后台

2. **点赞功能测试**
   - 前端点击点赞按钮
   - 验证 API 调用成功（CORS 已修复）
   - 检查数据库 `likes` 表是否有新记录
   - 验证文章的 `likes` 计数是否增加

3. **关联查询测试**
   - 在 Strapi 管理后台查看文章详情
   - 验证 `articleLikes` 关联是否正确显示
   - 测试通过 GraphQL 查询点赞记录

## 相关修复

本次推送还包含了之前的 CORS 修复：

**文件：** `backend/config/middlewares.ts`

```typescript
origin: [
  'http://localhost:3000',
  'https://lizizai.xyz',           // ✅ 生产域名
  'https://www.lizizai.xyz',       // ✅ www 子域名
  // ... 其他域名
],
```

## 经验教训

1. **双向关联必须完整定义**
   - 在 Strapi 中创建关联时，必须在两个模型中都正确配置
   - `inversedBy` 和 `mappedBy` 必须相互对应

2. **本地测试的局限性**
   - 本地开发环境可能不会严格检查某些配置错误
   - 应该在本地运行 `strapi start` 而不仅仅是 `strapi develop`

3. **部署前验证**
   - 每次修改 schema 后都应该运行 `npm run build`
   - 检查构建日志中的警告和错误

## 后续监控

- [ ] 监控 Render 部署日志
- [ ] 验证 Strapi 启动成功
- [ ] 测试点赞 API 端点
- [ ] 检查数据库表结构
- [ ] 进行端到端功能测试

---

**修复提交：**
- Commit 1: 58fd558 - CORS 配置修复
- Commit 2: 270adbb - 关联关系修复

**预计部署时间：** 3-5 分钟

---

*文档生成时间：2025年11月3日*  
*修复执行者：Manus AI*
