# 🚨 紧急：文章数据丢失问题

## 问题现象

**Strapi 管理面板显示 "0 entries found" - 所有文章数据消失！**

- 时间：2025-10-31 04:44 GMT
- 影响：所有 8 篇文章无法在管理面板中查看
- API：返回空响应
- 前端：文章详情页 404

## 可能的原因

### 原因 1：禁用 Draft & Publish 导致的 Schema 不兼容

**最可能的原因**

当我们修改 `article/schema.json` 将 `draftAndPublish` 从 `true` 改为 `false` 时：

1. Strapi v5 会修改数据库 schema
2. 可能删除或重命名了 `publishedAt` 字段
3. 导致现有数据无法被查询到

**证据：**
- 修改前：文章在管理面板中可见（虽然 publishedAt 为 null）
- 修改后：文章完全消失

### 原因 2：数据库迁移失败

Render 部署时可能没有正确执行数据库迁移，导致：
- Schema 更新了
- 但数据没有正确迁移

### 原因 3：数据库连接问题

可能是 PostgreSQL 数据库连接配置有问题，导致 Strapi 连接到了错误的数据库或 schema。

## 🔍 诊断步骤

### 步骤 1：检查数据库中的实际数据

需要登录 Supabase，直接查询数据库：

```sql
-- 检查 articles 表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%article%';

-- 检查 articles 表的数据
SELECT id, title, slug, "publishedAt", "createdAt", "updatedAt" 
FROM articles 
LIMIT 10;

-- 检查表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles';
```

### 步骤 2：检查 Render 部署日志

查看最新的部署日志，查找：
- Database migration warnings
- Schema update errors
- Data loss warnings

### 步骤 3：恢复 Draft & Publish

**紧急恢复方案**

如果数据仍然在数据库中，我们可以：

1. 恢复 `draftAndPublish: true`
2. 重新部署
3. 在管理面板中重新发布文章
4. 然后再考虑是否禁用 Draft & Publish

## 🔧 紧急恢复方案

### 方案 A：立即恢复 Draft & Publish（推荐）

```bash
# 1. 恢复 schema 配置
cd /home/ubuntu/lizizai-blog
git revert HEAD~1  # 撤销禁用 Draft & Publish 的提交

# 2. 推送并等待部署
git push origin main

# 3. 等待 Render 部署完成
# 4. 检查管理面板是否恢复数据
```

### 方案 B：直接查询数据库并手动修复

如果数据仍在数据库中，可以：

1. 登录 Supabase
2. 运行 SQL 更新所有文章的 `publishedAt`：
   ```sql
   UPDATE articles 
   SET "publishedAt" = "createdAt" 
   WHERE "publishedAt" IS NULL;
   ```
3. 重启 Strapi 服务

### 方案 C：从备份恢复（如果有）

如果 Supabase 有自动备份，可以：
1. 恢复到修改前的数据库快照
2. 重新部署后端

## 📊 数据库连接信息

**Supabase 数据库：**
- Host: `db.guucwbjysexvochrnhco.supabase.co`
- Database: `postgres`
- Schema: `public`
- Username: `postgres.guucwbjysexvochrnhco`
- Port: `5432`

**登录 Supabase Dashboard：**
https://supabase.com/dashboard/project/guucwbjysexvochrnhco

## 🎯 立即行动

**建议您立即执行以下操作之一：**

### 选项 1：恢复 Draft & Publish（最安全）

我可以立即执行 `git revert` 恢复配置，重新部署。

### 选项 2：检查数据库

您登录 Supabase，运行上述 SQL 查询，确认数据是否还在。

### 选项 3：我帮您检查

如果您提供 Supabase 的访问权限（或者告诉我如何访问），我可以直接检查数据库状态。

---

**请立即告诉我您希望采取哪个方案！**

时间紧迫，我们需要尽快恢复数据访问。
