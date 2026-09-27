# 飞书→R2 同步器：增量判断契约

来源：2026-09-28 任务 `09-28-feishu-sync-stall-fix`（每日资讯停更一个多月的根因修复）。

## 1. Scope / Trigger

`workers/feishu-blog-sync` 通过 GitHub Actions（`.github/workflows/feishu-sync.yml`）每日全量扫描飞书云文档并增量同步到 R2。涉及存储集成与工作流超时告警，属基础设施契约。

## 2. Signatures

- 判断：`blogFolderNeedsSync(client, blogFolder, existingMap)` → `{ needsSync, cached?, subItems? }`（sync.ts）
- 写入：`syncSlidesFolder` / `syncHtmlFolder` / `syncPodcastFolder` 返回 `maxModifiedTime`，由 `syncBlogFolder` 组装进 `meta.contentTypes.syncCheckpoints.{article,podcast,slides,html}`（ISO 字符串）
- 索引：`performSync` 写 `${R2_BASE_PATH}/articles.json`；循环内每 10 篇增量落盘一次，循环后完整写入

## 3. Contracts

- **口径一致（核心契约）**：判断侧与写入侧对每个类型子文件夹必须取**同一列表口径**——顶层 `client.listFiles(folder.token)` 的 max mtime，**含 screenshots 等子文件夹条目**。飞书文件夹条目 mtime 恒晚于其内部文件 1–2 秒；任何一侧改用递归文件列表都会使检查点永远偏小 → 每轮全量重传。
- 增量基准是「各内容类型独立高水位」，不是"子文件 mtime > 文章 mtime"（播客/PPT 晚于文章生成，后者会永久失效）。
- `articles.json` 必须可从中断中恢复：超时被杀时已处理文章的 meta 已随检查点落盘，索引也要有中途快照。
- R2 公开 URL（r2.dev）有 CDN 缓存，验证时加 `?t=<ts>` 绕过。

## 4. Validation & Error Matrix

| 条件 | 行为 |
|------|------|
| 某类型 mtime > 自身 checkpoint | 重传该文章全部内容 |
| 各类型 mtime 均 ≤ checkpoint | `[skip]` |
| 无 checkpoint（新文章/旧数据） | 需要同步 |
| job 超时被杀 | 状态为 **cancelled 而非 failure**——通知步骤必须 `if: failure() \|\| cancelled()`（否则静默漏报） |
| articles.json 读取失败 | 当作空索引全量重建 |

## 5. Good/Base/Bad Cases

- Good：全量追赶 1h37m 后，次日运行分钟级、绝大多数 `[skip]`。
- Base：单文档文章走 `docNeedsSync`（飞书 mtime vs R2 meta updatedAt），与文件夹高水位互不影响。
- Bad（历史教训）：判断用顶层列表、写入用递归列表 → 76/162 篇每轮全量重传 ~2h > timeout 60min → 索引停更 35 天且无告警。

## 6. Tests Required

`workers/feishu-blog-sync/src/__tests__/sync-incremental.test.ts`（`npx tsx` 直跑）：
- 高水位独立判断（播客 300 > 文章 100 但 ≤ 自身 checkpoint → skip）
- **口径一致性回归**：顶层列表含子文件夹条目（402 > 内部文件 400）时，`syncSlidesFolder`/`syncHtmlFolder` 返回的检查点必须等于顶层 max（402），且该检查点下 `blogFolderNeedsSync` 判 skip

## 7. Wrong vs Correct

### Wrong

```ts
// 写入侧用递归文件列表记检查点（不含子文件夹条目 → 永远偏小）
const allFiles = await client.listAllFilesRecursive(folder.token);
maxModifiedTime: maxModifiedTime(allFiles)
```

### Correct

```ts
// 与判断侧同口径：顶层列表（含子文件夹条目 mtime）
const topItems = await client.listFiles(folder.token);
maxModifiedTime: maxModifiedTime(topItems)
```

> 若常规运行时长再次逼近 `timeout-minutes`，第一反应应是查增量是否失效（口径是否又被改歪），而不是调大超时。
