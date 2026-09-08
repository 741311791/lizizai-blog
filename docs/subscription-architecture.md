# 订阅系统架构设计

> 状态：2026-07 设计稿，MVP 阶段（Substack 免费订阅）
> 定位：订阅功能的专项设计文档。整体架构见 `docs/architecture.md`（第 7 节指向本文档）。

## 1. 背景与平台选型

### 1.1 目标
为博客接入订阅能力：读者订阅后，新内容发布时收到邮件通知；未来支持免费/付费内容分发。

### 1.2 选定 Substack
经对比 Substack / 小报童 / 自建方案，选定 **Substack** 作为订阅平台：
- publication：`https://lizizai.substack.com/`（"Zizai's Substack" by Zizai Li）
- 邮件投递、订阅者管理、确认流程、未来付费墙均由 Substack 托管
- **博客零后端订阅逻辑**：无 D1 订阅者表、无邮件群发、无 DOI 确认

### 1.3 ⚠️ 关键约束：国内访问
Substack 在中国大陆访问受限：
- 确认链接（`substack.com`）访问不稳定，常需 VPN
- Substack 无 ICP 备案，发出的确认邮件可能被国内邮箱（QQ/163）屏蔽或过滤
- **影响**：纯大陆普通读者的订阅漏斗会断裂

因此采用**国内外差异化**策略，分阶段实施：

| 阶段 | 国内读者 | 国外读者 |
|------|---------|---------|
| **当前 MVP** | 直连博客阅读（暂不订阅） | Substack 免费订阅 |
| **未来（小报童栏目就绪后）** | 小报童低价付费栏目 | Substack（免费 + 付费） |

国内读者当前阶段：直接在博客阅读免费内容，不做邮件订阅。

### 1.4 小报童为何暂不做
- 小报童**只支持付费**（官方明确"不做免费订阅，推荐公众号做免费"），抽成约 15%
- 创作者尚未开通小报童栏目
- 当前以免费内容为主，国内付费订阅推迟到栏目就绪后

## 2. 当前 MVP 范围

**只做：博客订阅入口接入 Substack（国外免费）**

| 入口 | 改造 |
|------|------|
| Header 右上角"订阅"按钮 | 不变，指向 `/subscribe` 页 |
| Footer 订阅区 | Resend 邮箱表单 → SubstackEmbed |
| `/subscribe` 页 | 清理虚假社交证明 + Resend DOI 流程 → SubstackEmbed |

**不做（YAGNI，留待未来）**：
- 文章级 `substack` frontmatter 标记（`substack: free/pay` + `substackUrl`）
- 同步器解析 + `Article` 类型扩展
- 文章页"这篇也在 Substack"提示
- 国内小报童入口
- Substack 付费内容

**理由**：当前 Substack 仅免费、博客全文展示，文章级标记没有展示用途。等需要差异化分发或付费引导时再加（见 §6.2）。

## 3. SubstackEmbed 组件设计

新建 `components/subscribe/SubstackEmbed.tsx`，封装三种形态：

| variant | 用途 | 状态 |
|---------|------|------|
| `button`（默认） | 深色跳转按钮 → `lizizai.substack.com` | ✅ 稳定，推荐 |
| `form` | 自定义深色邮箱框，提交跳 `subscribe?email=xxx` | ⚠️ email 预填待验证，验证有效后启用 |
| `iframe` | 官方 embed（`lizizai.substack.com/embed`） | ❌ 白底，与深色模式冲突，不推荐 |

### 为什么不用官方 iframe embed
- [Substack 官方明确](https://support.substack.com/hc/en-us/articles/360041759232)：embed 是 iframe，**不可定制样式**
- iframe 自带白底，博客是深色模式（OKLCH + shadcn），视觉割裂
- 改用博客自己的深色按钮/输入框，跳转 Substack 完成订阅（Substack 处理确认邮件），兼顾设计一致性与功能

### 订阅流程（读者视角）
```
点"订阅" → 跳 lizizai.substack.com（或 subscribe 页）
→ 输入邮箱 → Substack 发确认邮件 → 读者点确认链接 → 订阅生效
→ 后续新文章由 Substack 自动邮件推送
```

## 4. 现有 Resend 自建订阅的处理

代码库原有完整的 Resend 自建邮件订阅系统（DOI 双重确认流程），逐步替换：

| 文件 | 原实现 | 处理 |
|------|--------|------|
| `app/api/subscribe/route.ts` | Resend 发确认邮件 | **保留不删**（可回退），前端停止调用 |
| `app/[locale]/subscribe/page.tsx` | DOI 订阅页（表单 + confirmed/success 状态） | 替换为 SubstackEmbed + 清理虚假数据 |
| `components/layout/Footer.tsx` | 邮箱表单 → `/api/subscribe` | 替换为 SubstackEmbed |
| `components/layout/Header.tsx` | "订阅"按钮 → `/subscribe` | 不变（指向改造后的 `/subscribe` 页） |

> **保留 `route.ts` 的理由**：可逆原则。待 Substack 方案线上验证稳定后，再决定是否删除。

### 现有质量问题（替换时顺手修）
1. `subscribe/page.tsx` 含**虚假社交证明**（"178,000+ subscribers"、"178,000+ entrepreneurs"）——删除
2. `subscribe/page.tsx` 硬编码英文，未接 i18n——接入 `zh.json` 的 `subscribe` 段

## 5. i18n 文案

复用 `messages/{zh,en}.json` 现有 `subscribe` 段（`title`/`subtitle`/`benefitWeekly` 等已齐全）。
- **清理**：DOI 相关文案（`confirmed`/`success`/`almostThere`/`invalidLink` 等）不再需要
- **新增**：Substack 引导文案（如"在 Substack 订阅"、确认邮件提示）

## 6. 未来扩展点

### 6.1 国内小报童接入（栏目就绪后）
- 新增 `components/subscribe/XiaobotCard.tsx`（二维码 + 跳转链接）
- 订阅区改为**并列双入口**：Substack（国外）+ 小报童（国内）
- 地理路由：**并列展示，读者自选**（不依赖 IP 判断——翻墙用户的 IP 会显示为海外，自动判断反而误判）

### 6.2 文章级 Substack 标记（需要差异化分发时）
飞书 frontmatter 加：
```yaml
substack: free       # 或 pay（未来付费）
substackUrl: https://lizizai.substack.com/p/xxx
```
- 同步器 `parseFrontmatter`（`converter.ts:144`）已支持，约束：key 必须为 `\w+`（连字符不行），值字符串
- `Article` 类型加 `publishSubstack?: 'free' | 'paid'` + `substackUrl?: string`
- `ArticleMeta`（`sync.ts:31`）+ meta 构建（`sync.ts:660`）+ `blog-data.ts` `getAllArticles` 映射（`:29`）三处透传
- 文章页按标记渲染文末"在 Substack 阅读此文"引导

### 6.3 Substack 付费内容
- 国外付费意愿成熟后启用
- 博客展示策略 **B**：博客全文 + Substack 靠差异化（提前发布/独家内容）付费
- frontmatter `substack: pay` 触发付费标记

## 7. 运维工作流

```
飞书写文章 → GitHub Actions 同步 → R2 → 博客展示
                                    ↓
                        作者手动到 Substack 发布（触发邮件推送）
```

⚠️ Substack **无公开发布 API**，邮件投递必须作者在 Substack 编辑器**手动点发布**。博客不介入邮件链路。这是 Substack 商业模式决定的（它靠托管订阅者关系 + 邮件投递盈利）。

## 相关文档
- `docs/architecture.md` — 整体技术架构
- `CLAUDE.md` — 项目操作指引
- [Substack 官方：嵌入订阅表单](https://support.substack.com/hc/en-us/articles/360041759232)
- [小报童官方帮助（付费内容服务）](https://help.xiaobot.net/)
