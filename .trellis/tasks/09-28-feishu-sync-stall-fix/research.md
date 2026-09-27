# 研究：每日资讯停在 2026-08-23 的诊断记录

来源：会话 sess_933cc32a（2026-09-27 排查）。

## 现象

- 站点 daily-news 列表最新条目停在 2026-08-23；单篇文章 R2 文件却是新的（9/26、9/20、8/24 的 meta.json 均 HTTP 200）。
- GitHub Actions「飞书博客同步」近一个月每次运行约 60 分钟被取消（timeout），状态 cancelled 而非 failure → 无通知。

## 根因链

1. `blogFolderNeedsSync`（判断）对每个类型子文件夹 `listFiles(folder.token)` 取**顶层** max mtime —— 顶层列表含 `screenshots/` 等子文件夹条目。
2. 检查点写入（`syncBlogFolder` → `syncSlidesFolder`/`syncHtmlFolder` 返回的 `maxModifiedTime`）用 `listAllFilesRecursive` 的**仅文件** max mtime。
3. 飞书文件夹条目的 mtime 恒比其内部最新文件晚 1–2 秒（探针 `/tmp/feishu-probe.ts` 实测）。
4. 于是 slides/html 的 checkpoint 永远小于判断侧观测值 → 含 PPT/HTML 的文章每轮全量重传（实测 162 项：76 全量、6 跳过、其余耗时在重传上）。
5. 全量一轮 ~2h > `timeout-minutes: 60`，循环未结束即被杀；`articles.json` 在循环后统一写入（sync.ts:392）→ 索引永久停在 8/23。

## article / podcast 不受影响的原因

- article checkpoint：`maxModifiedTime(articleFolderItems)`，articleFolderItems 来自顶层 `listFiles` —— 与判断同口径。
- podcast checkpoint：`syncPodcastFolder` 内 `items = listFiles(folder.token)` 顶层 —— 同口径。

## 验证命令（只读）

- 索引：`curl 'https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev/blog-data/articles.json?t=<ts>'`（r2.dev 有 CDN 缓存，加查询参数绕过）。
- 运行历史：`gh run list --workflow=飞书博客同步 --limit 10`。

## 附带发现

- 飞书 Daily News 存在重复日期文件夹（2026-08-16、2026-08-21 各两个）→ 索引重复条目；属用户数据，仅提醒人工清理。
- 本地 `.env.local` 的 R2 凭据无效（上次会话实测），本地全量验证需走 GitHub Actions。
