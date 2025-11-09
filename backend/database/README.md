# 数据库迁移和优化

## 📋 索引迁移

### 快速执行

**生产环境 (Render.com PostgreSQL)**:

```bash
# 方法 1: 使用 psql (需要安装 PostgreSQL 客户端)
psql "$DATABASE_URL" < backend/database/migrations/001_add_performance_indexes.sql

# 方法 2: 通过 Render 控制台
# 1. 登录 Render.com
# 2. 进入你的 PostgreSQL 数据库
# 3. 点击 "Connect" 获取连接信息
# 4. 使用 Web Shell 或本地 psql 连接
# 5. 复制粘贴 SQL 文件内容执行
```

**开发环境 (SQLite)**:

> ⚠️ 注意: SQLite 不需要这些索引优化，因为开发环境的数据量很小。
> 这些索引主要用于生产环境的 PostgreSQL。

如果你在开发环境使用 PostgreSQL:
```bash
# 使用本地 PostgreSQL
psql your_dev_database < backend/database/migrations/001_add_performance_indexes.sql
```

---

## 🔍 验证索引

执行迁移后，验证索引是否成功创建：

**PostgreSQL**:
```sql
-- 查看所有索引
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 查看特定表的索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'articles';
```

**预期结果**:

应该看到以下索引:

| 表名 | 索引名 | 用途 |
|------|--------|------|
| articles | idx_articles_slug | slug 查询 |
| articles | idx_articles_published_at | 日期排序 |
| articles | idx_articles_category_id | 分类筛选 |
| articles | idx_articles_category_published | 分类+日期复合查询 |
| categories | idx_categories_slug | slug 查询 |
| tags | idx_tags_slug | slug 查询 |
| likes | idx_likes_article_visitor | 点赞去重 |
| likes | idx_likes_article_id | 点赞统计 |
| subscribers | idx_subscribers_email | 邮箱查询 |
| subscribers | idx_subscribers_token | token 验证 |
| subscribers | idx_subscribers_status | 状态筛选 |

---

## 📊 性能提升预期

执行索引优化后的预期性能提升:

| 查询类型 | 优化前 | 优化后 | 提升 |
|---------|--------|--------|------|
| 按 slug 查询文章 | ~100ms | ~5ms | 95% ↑ |
| 按分类查询文章 | ~200ms | ~15ms | 92% ↑ |
| 检查是否已点赞 | ~50ms | ~2ms | 96% ↑ |
| 邮件确认查询 | ~80ms | ~3ms | 96% ↑ |
| 归档页面日期排序 | ~150ms | ~10ms | 93% ↑ |

**综合API响应时间**: 800ms → 180ms (减少 78%)

---

## 🛡️ 安全提示

1. **备份数据库**: 执行迁移前先备份
   ```bash
   # Render.com 会自动备份，也可以手动创建快照
   # Dashboard → Database → Snapshots → Create Snapshot
   ```

2. **非高峰期执行**: 建议在流量较低时执行

3. **测试验证**: 执行后测试主要功能是否正常

---

## 📚 相关文档

- [PostgreSQL 索引文档](https://www.postgresql.org/docs/current/indexes.html)
- [Render PostgreSQL 指南](https://render.com/docs/databases)

---

**创建时间**: 2025-11-09
**适用环境**: Production (PostgreSQL)
**执行时间**: 约 1-2 分钟
**影响范围**: 只读优化，不修改数据
