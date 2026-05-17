# 飞书博客增量同步设计

> 日期：2026-05-12
> 状态：已实施
> 关联文档：`docs/migrate-sync-to-github-actions.md`

## 1. 背景与动机

### 当前问题

飞书到 R2 的同步是**全量模式**：每次触发都重新下载并上传所有文章（含图片、播客音频、PPT 文件）。GitHub Actions 上一次完整同步耗时约 4 分钟，其中大部分时间花在未变更文章的重复下载上。

现有代码中的"增量判断"（`sync.ts`）只对旧格式单文档文章生效，且只检查 token 是否存在，不比较修改时间。多内容类型文件夹（文章+播客+PPT）**每次都全量同步**。

### 目标

利用飞书 API 返回的 `modified_time` 字段与 R2 `meta.json` 中的 `updatedAt` 比较，只同步实际变更的文章。

---

## 2. 变更检测策略

### 核心逻辑

```
飞书 file.modified_time > R2 meta.json.updatedAt  →  需要同步
飞书 file.modified_time <= R2 meta.json.updatedAt  →  跳过
R2 中无对应 meta.json                              →  新文章，需要同步
```

### 深层检测（已采用）

遍历文章+播客+PPT 三个子文件夹，检查所有文件的 `modified_time`，取最大值与 R2 `meta.updatedAt` 比较。

| 层级 | 检测对象 | 比较方式 | 额外 API 调用 |
|------|---------|---------|-------------|
| **L1 文档** | 文章 docx 文件 | `file.modified_time` vs `meta.updatedAt` | 1 次 |
| **L2 播客** | 播客子文件夹所有文件 | 取最大 `modified_time` | 1 次 |
| **L3 PPT** | PPT 子文件夹所有文件 | 取最大 `modified_time` | 1 次 |
| **L4 新文章** | R2 中不存在 blogFolderToken | 直接同步 | 0 次 |

每次增量检测额外开销：3 次 `listFiles` API 调用（约 1-2 秒）。

### 数据可行性

- 飞书 `listFiles()` 返回每个文件的 `modified_time`（Unix 时间戳）
- R2 `meta.json` 存储了 `updatedAt`（ISO 8601 格式）
- `updatedAt` 来源于 `new Date(parseInt(file.modified_time) * 1000).toISOString()` — 时间来源一致

---

## 3. 实施方案

### 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `workers/feishu-blog-sync/src/sync.ts` | 新增 `SyncResult` 接口、`docNeedsSync`、`blogFolderNeedsSync` 函数；修改 `performSync` 支持增量判断 |
| `workers/feishu-blog-sync/src/cli.ts` | 新增 `--force` 命令行参数 |
| `.github/workflows/feishu-sync.yml` | 新增 `force_sync` 输入参数 |

### 新增类型

```typescript
export interface SyncResult {
  articleCount: number;
  synced: number;    // 实际同步的文章数
  skipped: number;   // 跳过的文章数（未修改）
}
```

### 新增函数

#### `docNeedsSync` — 单文档增量判断

比较飞书 `file.modified_time` 与 R2 `meta.updatedAt`，未变更时返回缓存的 `ArticleMeta`。

#### `blogFolderNeedsSync` — 多内容类型文件夹深层检测

遍历文章、播客、PPT 三个子文件夹，检查所有文件的 `modified_time`。任一文件更新则触发整篇重新同步。

### 修改 `performSync`

- 函数签名新增 `forceSync = false` 参数
- 遍历每个 item 时先做增量判断
- 日志输出 `[skip]` 标记和 `synced/skipped` 统计

### CLI 用法

```bash
# 增量同步（默认）
npx tsx src/cli.ts

# 强制全量同步
npx tsx src/cli.ts --force
```

### GitHub Actions

手动触发时可选"强制全量同步"，默认增量。

---

## 4. 性能预估

| 场景 | 当前耗时 | 增量后耗时 | 节省 |
|------|---------|-----------|------|
| 无文章更新 | ~4 min | ~15s | 95% |
| 1 篇文章更新 | ~4 min | ~30s | 87% |
| 1 篇多内容类型更新 | ~4 min | ~60s | 75% |
| 全量更新（force） | ~4 min | ~4 min | 0% |

---

## 5. 验证方案

1. **增量同步**：运行 `npx tsx src/cli.ts`，检查日志输出 `[skip]` 标记和 `skipped` 计数
2. **全量同步**：运行 `npx tsx src/cli.ts --force`，所有文章重新同步
3. **修改检测**：在飞书编辑一篇文章 → 再次运行增量同步 → 确认仅该文章被重新同步
4. **GitHub Actions**：手动触发 workflow（默认增量），检查 synced/skipped 计数
5. **边界情况**：
   - 飞书中新增一篇文章 → 增量同步应自动检测并同步
   - 飞书中删除一篇文章 → 增量同步应触发清理逻辑
   - 播客音频更新但文章未更新 → 深层检测应检测到并重新同步
