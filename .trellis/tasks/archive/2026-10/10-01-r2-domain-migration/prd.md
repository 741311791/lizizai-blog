# R2 写侧域名统一：r2.dev → 自定义域

## Goal

封面 URL 写侧从 r2.dev 免费子域（有速率限制）统一到自定义域 `lizizai-blog.lihehua.xyz`（CF CDN），消除读写双轨。

## Background（前置验证已完成）

- 自定义域对 articles.json 与图片对象均 200（curl/浏览器 UA）；Python-urllib UA 被 CF Bot 检测挡 403 属误报
- `isR2CdnImage` 已含 lihehua.xyz：R2 图片 unoptimized 浏览器直连，不经 Vercel 优化器 → 无 UA 兼容风险
- 存量：161 篇文章、154 个封面 URL 全为 r2.dev（articles.json 实测）
- 写侧链路：workflow env R2_PUBLIC_URL → sync.ts:494 拼接 coverImage → meta.json + articles.json
- 增量同步不重写未变文章（mtime 检测）→ 必须一次 force 全量重写

## Requirements

- R1 `.github/workflows/feishu-sync.yml`：R2_PUBLIC_URL 改自定义域
- R2 同文件 timeout-minutes 60→180（临时，全量追赶约需 1.5-2h，先例 09-28 任务）
- R3 `workers/feishu-blog-sync/src/cli.ts` 兜底与注释同步更新
- R4 commit + push 后 `gh workflow run feishu-sync.yml -f force_sync=true --ref main`
- R5 验证：同步成功 + articles.json 封面域名全为自定义域 + 线上封面正常
- R6 验证通过后 timeout-minutes 回 60，前端 blog-data-utils.ts 双轨注释更新为已统一，收尾 commit

## Acceptance Criteria

- [x] AC1 workflow 完成且非 cancelled/failure
- [x] AC2 articles.json 中 r2.dev 出现次数为 0
- [x] AC3 线上首页/文章页封面正常加载（自定义域）
- [x] AC4 timeout 已回 60，注释无双轨残留

## 执行记录

- 前置验证：自定义域对图片对象 200（首测 403 系 CF Bot 检测挡 Python-urllib UA 误报）；isR2CdnImage 已含自定义域且 unoptimized 直连，无 Vercel 优化器兼容风险
- 第一轮追赶失败（9m9s 实为增量）：发现 workflow 既有 bug——force_sync 为 boolean input 但表达式 `== 'true'` 字符串比较恒 false，**手动全量从未真正生效过**；修复为 boolean 直判（f50a5e8）
- 第二轮真全量：1h40m31s，163/163 篇重写（同步 163 跳过 0），articles.json r2.dev 归零、156 封面全为自定义域
- 收尾（50fc035）：timeout 回 60+注释补全量时长、blog-data-utils 注释简化、next.config 保留 r2.dev 白名单作 ISR 过渡兼容
- 线上验证：首页封面 img src 已为自定义域，抽查 200
