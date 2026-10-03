---
name: tech-blog-writer
description: 为 lizizai 博客写中文技术文章的完整流水线：事实素材包 → Gemini 生成 → 程序化质检 → 修正落稿 → 上传飞书分类 → 同步上线 → 接线链接；含去 AI 味自循环（detect.py 中文检测 + avoid-ai-writing 英文 + 腾讯朱雀人工环节 → 段落级重写 → 事实 diff → 人终审）。用户要求写博客文章、系列文章、项目复盘、传飞书、去 AI 味时使用。
---

# 技术博客写作流水线

把「写文章」拆成「编素材 → 生成 → 质检 → 发布」四段。核心原则：**事实由人（主会话）把关，行文由 LLM（Gemini）生成，质量由脚本核验**。禁止跳过质检直接落稿。

## 第一步：编事实素材包

素材包是给 Gemini 的 prompt，结构固定（参考 `blog-series/.gemini/*-prompt.json` 的实例）：

```
角色设定（中文个人技术博客博主，笔名李自在 + 系列/栏目背景）
【必须原样保留的内容】代码块（含文件路径注释）、Mermaid 图、对比表——逐字嵌入 prompt
【事实素材】全部数字、日期、时间线、技术细节，按时间顺序写清；
  展开方向单独列出，标注「按通用工程实践写，不要编造具体内部代号/客户名」
【写作要求】见下方风格规则 + 禁语清单 + 字数 + 指定标题
【输出格式】第一行必须一字不差是指定标题
```

素材红线：
- 数字只准用素材里有的（一个不加、不改、不编）
- 不虚构客户名、项目代号、内部系统名——泛称（「客户现场」「某省交通部门」）
- 每篇恰好 1 张 Mermaid + 1 张对比表 + 1-3 个代码片段（系列规范）

## 第二步：Gemini 生成

```bash
curl -s --max-time 270 -x http://127.0.0.1:7897 -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" -d @<prompt.json> -o <out.json>
# generationConfig: temperature 0.85, topP 0.95, maxOutputTokens 12288-16384
```

坑：
- **篇与篇间隔 ≥70 秒**，连发会被 404/503；503 是全球拥塞，退避重试或问用户换模型
- `gemini-3.8-flash` 常拥塞、`3.1-pro` 常配额 429，可用的是 `gemini-2.5-flash`（2026-10 实测）
- 正文解析：`candidates[0].content.parts[0].text`

## 第三步：程序化质检（不许省）

对生成文逐项检查（python 脚本，实例见 `blog-series/.gemini` 的质检代码）：

| 检查项 | 方法 |
|---|---|
| 标题一字不差 | `t.startswith(指定标题)`——**Gemini 最爱自创标题，必查** |
| 禁语清单 | grep（见下）；残留用宽松正则逐处改写，改不中的精确看上下文 |
| 数字加粗 | `**` 全文清零（`\*\*([^*\n]+)\*\*` 去除），Gemini 爱给数字加粗 |
| 代码围栏配对 | `t.count('\n```') % 2 == 0`；嵌套列表里的代码块缩进会坏围栏，整块提到行首 |
| 必留内容完整 | 数字/代码/图表关键词逐个 `in` 检查（如 '8月23日'、'cron'、'```mermaid'） |
| 编造检测 | 搜时间跨度（「三年」「两年」）、具体名词——素材里没有的就是编的，删 |

**禁语清单**（实战最高频的 AI 痕迹）：「先摆两个数字」「先把链路摆一下」「两个很便宜的动作」「先说结论」「先交代一个事实」「这期的要点」「值得注意的是」「不难发现」「综上所述」「这意味着」（最后这个 Gemini 每篇都写 2-4 次，重点盯）

**风格规则**（源自真人中文技术博客样本提炼，全文见 `blog-series/STYLE-RULES.md`）：
开头禁设计钩子（真人三种起法：经历流水/直接进主题/时间事件）；结构不对称允许硬切；比喻全文 ≤2 处；允许承认「不知道/莫名其妙好了」；时间锚点具体（「9月28日晚上」不是「后来」）；段落长短悬殊、关键句单句成段；数字随事件出现不集中展示；保留纯弯路不强行升华；结尾去仪式（不写四条要点总结）。

质检不过 → 修复后复检；修不动 → 报告用户，不硬发。

## 第四步：落稿与上传

```bash
# 落稿（去首行标题 + 注释行后为上传正文；文末加生成标记注释）
# 新建（parent-token 决定分类文件夹）：
lark-cli docs +create --doc-format markdown --as user \
  --title "<标题>" --content "@<clean.md>" --parent-token "<分类文件夹token>"
# 更新已有文档（全区间替换，内容必须以标题开头）：
lark-cli docs +update --doc <doc-token> --command block_replace \
  --start-block-id 0 --end-block-id -1 --doc-format markdown --as user --content "@<clean.md>"
```

分类文件夹 token（同步根 `RnSDfNdqZlcEtud4JjpcjtpKncg` 下）：AI=`SsRkfi9lbliHBFdcSWAcXmxUnrd`，Portfolio=`GDqNfI1aQlwjXidJXogcl6sznvc`，其余用 `lark-cli drive files list --folder-token <根> ` 查。

## 第五步：同步上线与接线

```bash
gh workflow run feishu-sync.yml --ref main        # 触发增量同步
# 同步完成后从 articles.json 取真实 slug（中文 slug 由 sync.ts slugify 生成，勿自行推导）：
curl -s https://lizizai-blog.lihehua.xyz/blog-data/articles.json | python3 -c "..."
```

- 页面上线走 ISR（≤1 小时自动刷新）；急可调 `/api/revalidate`
- 页面内链接（如简历卡「查看详情」）必须用 articles.json 实测 slug
- 脚本验证一律 curl 管道，**勿用 urllib 直连**（CF 自定义域挡 Python UA 返回 403）

## 第六步：去 AI 味自循环（生成后的迭代打磨）

对已生成的初稿（或用户提供的任何旧文）做「检测 → 定位 → 段落重写 → 质检 → 收敛 → 人终审」循环，最多 3 轮。

### 检测层（三个工具各司其职）

| 工具 | 用途 | 用法 |
|---|---|---|
| `scripts/detect.py`（本 skill 自带） | **中文主信号**：禁语 grep（实测每篇必中）+ 数字/短语加粗 + 句长 CV（弱信号只看趋势） | `python3 .claude/skills/tech-blog-writer/scripts/detect.py <文章.md> [--json]`，退出码 0 干净/1 有疑似 |
| `avoid-ai-writing`（~/.claude/skills/，4830★，54.9k★ awesome 合集收录） | **英文 AI-isms**：49+ 模式类别、detect/rewrite/edit 三模式、确定性 0-100 检测引擎（npm: avoid-ai-writing-detector，CI 测试）。规则校准于英文——中文正文用我们的 detect.py，英文段落/术语句用它 | detect 模式扫描；重写循环只用它的检测不用它的重写（中文语感归 Gemini） |
| **腾讯朱雀**（matrix.tencent.com） | **中文检测的事实标准**（分句染色疑似度）。无公开 API，走人工环节：打开网页 → 微信/QQ 扫码登录 → 粘贴全文 → 把总分和标红句子回报会话 | **改写前测一次、终审前再测一次**，只看趋势不看绝对值（防过拟合：为骗检测器改写会产出新的怪味） |

### 循环执行

1. **检测**：三工具并行，汇总疑似段落清单（detect.py 段落级定位 + avoid-ai-writing 英文标记 + 朱雀标红句）
2. **定位过滤**：禁语命中要豁免「引用原话」和「讨论该词本身」两类；句长 CV 弱信号不单独触发改写
3. **段落级重写**（只动疑似段，不全文重写）：Gemini 单段 prompt（待改段落 + 前后文 + 该段具体问题 + 红线「事实数字术语代码不许动」+ 禁语清单），curl 调用同第二步，段间隔 ≥20s
4. **事实 diff 质检**（每轮必做）：改写前后数字序列必须全等、术语集合只减不增；不过则该段回滚重写一次，仍不过保持原文（宁可留 AI 味不编事实）
5. **收敛**：复检疑似项不降即停，最多 3 轮
6. **人终审**（不可省）：输出改写稿 + Before/After 段落对照 + 检测分变化。用户的「为什么还是 AI」反馈逐条记入下一篇文章的重写约束——学习闭环在人，不在检测器

### 防过拟合铁律（实测校准 2026-10-03）

- 用户验收过的文章，句长 CV 疑似项可能多于被否掉的初稿——**检测分是参考不是裁判**，循环目标是「收敛 + 人觉得对味」
- 句长 CV 只对学术长句文有区分度，博客短段落体上验收稿与退稿无差异

## 长文写作的素材组织

若写新系列：先出 `SERIES-BRIEF`（结构/风格/硬性指标）+ `OUTLINE`（每期要点/必留内容/事实核对来源），用户确认后再逐篇生成——「先定规则再动笔」是这套流程能一次过的前提。
