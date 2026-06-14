# ai-daily-extract — AI 日报结构化数据提取 Skill

将 AI 日报的 Markdown 内容提取为符合 JSON Schema 的结构化数据，供 `templates/ai-daily/template.html` 渲染使用。

**核心理念**：通过 LLM 的语义理解提取结构化数据，而非正则/脚本解析。日报格式会随时间演化（板块增减、字段调整、措辞变化），LLM 能自适应这些变化，避免代码因格式微调而崩溃。

## 触发

- 用户提供 AI 日报 Markdown 内容/文件路径，要求提取结构化数据
- 用户提到「日报提取」「Markdown 转 JSON」「日报结构化」
- `/ai-daily-extract`

## 核心流程

```
输入 Markdown → 阅读 schema.json → 语义理解 → 提取 → 自检 → 输出 JSON
```

### 第一步：读取 Schema

**必读**：`references/schema.json` 是输出格式的唯一权威定义。提取前必须先 Read 这个文件，理解每个字段的类型、是否必填、用途。

关键约束（从 schema 派生）：
- 顶层只有 `meta` + `overview` 必填，其余 8 个板块（headline / news / openSource / modelsAndProducts / companyUpdates / funding / opinions / research）全部可选——某板块在 Markdown 里不存在就**不要**输出该字段
- `overview.boxes` 是数组，每项 `{label, text}`，数量和标签由原文决定，不要硬编码

### 第二步：语义理解 + 提取

阅读 Markdown 全文，按板块对应关系提取。**不要用正则匹配**，而是理解每段内容的语义角色。板块识别依据 `##` 标题（如 `## 今日概览`、`## 头条聚焦`），但同一板块在不同日报里标题可能有细微差异（如 `## 模型与产品` 也可能写作 `## 模型产品`），LLM 应容忍这类变化。

### 第三步：自检

输出前逐板块核对字段完整性。详见下方「质量检查清单」。

### 第四步：输出

- 默认输出到 stdout（终端可见）
- 若用户指定了输出路径，写入文件
- JSON 必须是合法 JSON（双引号、无尾逗号、字符串内引号已转义）
- 中文内容不转义为 `\uXXXX`，保留原文（`ensure_ascii=False`）

---

## 板块映射表

Markdown 的典型结构与 JSON 字段的对应关系。这是**参考模式**，不是死规则——若实际 Markdown 有偏差，按语义归位即可。

### meta（必填）

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| 文件名中的日期（如 `ai-fast-learning-2026-06-09.md`）或正文中的日期 | `meta.date`（格式 `YYYY-MM-DD`） |
| 固定值或原文标题前缀 | `meta.title`（默认 `李自在AI 日报`） |
| 文末 `数据截至 XXXX` 或采集时间戳 | `meta.collectedAt` |

### overview（必填）

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| 顶部引用块 `> *每日精选...*` | `overview.summary` |
| `## 今日概览` 下每个 `**标签：**` + 列表/段落 | `overview.boxes[]`，每项 `{label, text}`（label 取冒号前文字，text 取其后内容） |
| `关键词：\`tag1\` \`tag2\`` | `overview.keywords`（字符串数组） |

**注意**：原文可能有 2-5 个不同标签的概览框（如「热点话题」「AI+教育 赛道信号」「独立开发者关注」「本周值得关注」），全部放入 `boxes` 数组，**不要**丢失任何一个，也**不要**捏造原文没有的框。

### headline（可选）

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| `## 头条聚焦` 下的第一段总结文字 | `headline.summary` |
| `**信息源**：XXX` | `headline.source` |

### news（可选）

`## 头条聚焦`（或独立新闻板块）下的每个 `### 新闻标题`：

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| `###` 标题文字 | `news[].title` |
| `- **来源**：[文字](url)` | `news[].source`（取链接文字）+ `news[].url`（取链接 URL） |
| `- **要点**：XXX` | `news[].keyPoints` |
| `- **解读**：XXX` | `news[].analysis` |

**注意**：`url` 是可选字段，若来源只有纯文字无链接，则只填 `source` 不填 `url`。

### openSource（可选）

`## 开源速递` 板块：

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| `**信息源**：` | `openSource.source` |
| `**趋势总结**：` | `openSource.summary` |
| `**重点关注**：` | `openSource.highlight` |
| 每个 `### 项目名` 下的字段 | `openSource.items[]` |

每个 OSS item 的字段：

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| `###` 项目名 | `name` |
| `- **仓库**：url` | `repo` |
| `- **Stars**：34,394（今日新增 3,558）` | `stars`（整数 `34394`）+ `starsToday`（整数 `3558`） |
| `- **简介**：` | `description` |
| `- **标签**：tag1 / tag2 / tag3` | `tags`（按 `/` 分割成数组） |
| `- **独立开发者价值**：` | `devValue` |
| `- **来源**：` | `source` |

**注意**：`stars` 和 `starsToday` 必须是**整数**（去掉千分位逗号），不是字符串。

### modelsAndProducts（可选）

`## 模型与产品` 板块：

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| 板块第一段总结 | `summary` |
| `**信息源**：` | `source` |
| `### 国外` 下的 Markdown 表格 | `foreign[]` |
| `### 国内` 下的 Markdown 表格 | `domestic[]` |

表格每行 → `{project, update, highlight, source}`，其中 `source` 取链接文字（如 `[Apple ML Research](url)` → `Apple ML Research`）。

### companyUpdates（可选）

`## 头部厂商动态` 板块：

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| 板块第一段 | `summary` |
| `**信息源**：` | `source` |
| `**关注范围**：` | `scope` |
| `- **Company**：update — 来源：[source](url)` | `items[]` → `{company, update, source}` |

**注意**：列表项里的 `—` 或 `来源：` 后面的是来源，拆分时不要混入 `update`。

### funding（可选）

`## 融资与投资` 板块：

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| 板块第一段 | `summary` |
| `**信息源**：` | `source` |
| `### 近期重大融资事件` 下的表格 | `events[]` |
| `### 宏观融资数据` 下的表格 | `macroData[]` |
| `**AI 投融资趋势分析**` 后的全部正文 | `trendAnalysis`（保留段落换行 `\n\n`） |

融资事件表格行 → `{company, round, amount, valuation, investors, direction, source}`
宏观数据表格行 → `{metric, value, source}`

**注意**：
- 表格单元格里的 `[text](url)` 链接，`source` 字段只取 `text`
- `valuation` 或 `investors` 可能为空，填 `null` 或省略
- `trendAnalysis` 里的 `**小标题**` 保留原文格式，不要删除粗体标记

### opinions（可选）

`## 观点与言论` 板块：

每个观点块格式通常为：
```
**人名**，头衔

> "英文原文"
> "中文翻译"
> 来源：[source](url)
```

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| 板块第一段 | `summary` |
| `**信息源**：` | `source` |
| `**人名**，头衔` | `items[].person` + `items[].title` |
| blockquote 第一行（英文） | `items[].quoteOriginal` |
| blockquote 第二行（中文） | `items[].quote` |
| `来源：[source](url)` | `items[].source` |

**注意**：若 blockquote 只有一行（无英文原文），则只填 `quote`，不填 `quoteOriginal`。中文翻译才是 `quote` 的主值。

### research（可选）

`## 研究与论文` 板块：

每个 `### 论文标题`：

| Markdown 来源 | JSON 字段 |
|--------------|-----------|
| 板块第一段 | `summary` |
| `**信息源**：` | `source` |
| `###` 论文标题 | `papers[].title` |
| `- **团队**：` | `team` |
| `- **链接**：url` | `link` |
| `- **摘要**：` | `abstract` |
| `- **意义**：` | `significance` |
| `- **提交日期**：2026-06-05` | `date`（格式 `YYYY-MM-DD`） |

---

## 字段提取规则（语义化，非正则）

1. **链接处理**：Markdown 链接 `[text](url)` 出现在 `source` 类字段时，提取 `text` 作为字段值；出现在 `url`/`link`/`repo` 类字段时，提取 URL。若同一条目同时需要来源名和 URL（如新闻），分别填入 `source` 和 `url`。

2. **数字清洗**：Stars 数、金额数字若有千分位逗号（`34,394`），转为整数 `34394`。金额字符串（`$650 亿`）保持原样，不要转数字。

3. **可选字段**：schema 里标 `required` 的字段缺失时，该条目仍输出但只填有的字段；非 required 字段缺失时直接省略（不要填空字符串 `""`，用省略表示「无」）。

4. **板块缺失**：若整个板块在 Markdown 里不存在，顶层不要输出该 key。模板会自动跳过缺失板块。

5. **文本保留**：正文字段（summary、keyPoints、analysis、abstract、trendAnalysis 等）保留原文措辞，**不要**改写、润色或摘要——提取是搬运，不是编辑。`trendAnalysis` 内的段落分隔用 `\n\n`。

6. **列表合并**：概览框里的有序列表（多个 `1. 2. 3.` 项），合并为单个 `text` 字段，各项用换行 `\n` 连接，不要丢失任何一条。

---

## 质量检查清单

输出 JSON 前，逐项自检：

- [ ] `meta.date` 存在且格式 `YYYY-MM-DD`（从文件名或正文推断）
- [ ] `overview.summary` 存在
- [ ] `overview.boxes` 数组完整（原文有几个标签的框就输出几个，不遗漏不捏造）
- [ ] `overview.keywords` 是字符串数组
- [ ] `news[]` 每条都有 `title` + `keyPoints`；有链接的填了 `url`
- [ ] `openSource.items[]` 的 `stars` / `starsToday` 是整数
- [ ] `modelsAndProducts` / `funding` 表格行的 `source` 提取了链接文字而非原始 Markdown
- [ ] `opinions.items[]` 的 `quote` 是中文，`quoteOriginal` 是英文（若存在）
- [ ] `research.papers[]` 的 `link` 是纯 URL
- [ ] `funding.trendAnalysis` 保留了段落分隔 `\n\n`
- [ ] JSON 合法（双引号、无尾逗号、字符串内引号已转义）
- [ ] 中文未被 `\uXXXX` 转义
- [ ] 缺失板块未输出（而非输出空对象）

---

## 输入输出约定

### 输入

用户提供 Markdown 内容的两种方式：
- 文件路径（如 `/tmp/daily.md` 或 `content/daily/xxx.md`）→ 用 Read 工具读取
- 直接粘贴 Markdown 文本

若用户只给日期或文章 slug，可从 R2 拉取：
```
https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev/blog-data/articles/daily-news/<slug>/content.md
```

### 输出

- **默认**：将 JSON 写入文件（路径由用户指定，或默认 `templates/ai-daily/data-<date>.json`）
- **调试**：也可在终端打印完整 JSON

输出后告知用户：
1. 提取了哪些板块（列举）
2. 各板块条目数（如 news 6 条、papers 5 篇）
3. JSON 文件路径
4. 下一步建议（如「可注入 template.html 预览效果」）

---

## 注意事项

- **不要写 Python 脚本做提取**。本 Skill 的价值就是用 LLM 语义理解代替脆弱的正则解析。日报格式变化时，LLM 自然适配，无需改代码。
- **提取 ≠ 改写**。保留原文措辞，不要润色、摘要、翻译。你的任务是结构化搬运。
- **完整性优先**。宁可在某个不确定字段上保留原文模糊信息，也不要为了「干净」而丢弃内容。
- **Schema 是契约**。输出必须能通过 `references/schema.json` 的校验。不确定字段类型时，回查 schema。
- 若用户同时提供了模板路径，可在提取后顺手验证：把 JSON 注入 `template.html` 的 `<script id="daily-data">` 标签，在浏览器打开确认渲染正常。
