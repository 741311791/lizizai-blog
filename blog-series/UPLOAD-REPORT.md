# 《无服务器博客搭建记》系列 · 终稿与上传报告

- 日期：2026-10-02
- 流程：writer-a（第 1-4 期）与 writer-b（第 5-7 期）并发初稿 → reviewer 逐期审阅（只润色不重构）→ 总编验收
- 规范依据：`blog-series/SERIES-BRIEF.md`（结构/对比/风格/硬性指标）、`blog-series/OUTLINE.md`（七期细纲）

## 一、终稿清单（blog-series/final/，7/7）

| 期 | 终稿文件 | 标题 | 正文字数（不含代码块与表） |
|---|---------|------|--------------------------|
| 1 | `blog-series/final/p1-feishu-as-cms.md` | 无服务器博客搭建记（1/7）：让飞书文档变成博客 | 4089 |
| 2 | `blog-series/final/p2-incremental-sync.md` | 无服务器博客搭建记（2/7）：同步器——163 篇文章如何做到每天只传有变化的 | 4033 |
| 3 | `blog-series/final/p3-four-content-types.md` | 无服务器博客搭建记（3/7）：一篇文章的四种形态 | 4402 |
| 4 | `blog-series/final/p4-edge-services.md` | 无服务器博客搭建记（4/7）：博客不碰数据库 | 3926 |
| 5 | `blog-series/final/p5-rendering-cost.md` | 无服务器博客搭建记（5/7）：把渲染成本从读者挪到构建时 | 4388 |
| 6 | `blog-series/final/p6-build-stability.md` | 无服务器博客搭建记（6/7）：构建为什么总是失败 | 4396 |
| 7 | `blog-series/final/p7-silent-failure.md` | 无服务器博客搭建记（7/7）：静默失败的一个月 | 4399 |

初稿存档：`blog-series/drafts/`（与终稿同名，共 7 篇，未删除）。

## 二、验收结论：全部通过

逐篇程序化检查 + 人工抽查，7 篇全部满足：

- ✅ 命名格式：标题均为「无服务器博客搭建记（N/7）：本期标题」
- ✅ 结构：7 章齐全且顺序固定（这期解决什么问题 / 背景 / 别人是怎么做的 / 我们是怎么做的 / 为什么这么选 / 踩过的坑 / 小结与下期预告）
- ✅ Mermaid：每篇恰好 1 张，\`\`\`mermaid 开头与 \`\`\` 结尾成对，语法抽查可渲染（p7 因果链含修复分叉等已人工核对）
- ✅ 对比表：每篇恰好 1 张三段式表头（维度 / 成熟方案 A / 成熟方案 B / 我们的方案）
- ✅ 代码片段 1-2 个/篇，均注明来源文件路径
- ✅ 正文字数 3926-4402，全部落在 3000-4500 区间（p5、p7 初版超限已退回 reviewer 精简并复验）
- ✅ 去 AI 味禁用词（「总而言之」「值得注意的是」「不难发现」「让我们」「综上所述」「在这个过程中」）零命中
- ✅ 审阅留痕：每篇末尾有 `<!-- review: ... -->` 修改记录；审阅未改动技术事实、代码与图

## 三、上传状态

**上传由主会话用 lark-cli 官方登录流程执行，本 Orch 未完成上传。见本报告后续更新（主会话追加飞书文档链接）。**

交接给主会话的上传要点（已在总编侧准备就绪）：

1. **上传内容已预处理**：`blog-series/.upload/p1-*.md … p7-*.md` 共 7 份，已去掉首行标题与 review 注释；正文风险字符扫描通过（无未转义的 XML 标签 / `$` / 行首 `>` `+`）
2. **命令模板**（在仓库根目录执行，`--doc-format markdown` 原样导入，mermaid 保持代码块）：
   ```bash
   lark-cli --as user docs +create --doc-format markdown \
     --title '无服务器博客搭建记（1/7）：让飞书文档变成博客' \
     --content '@./blog-series/.upload/p1-feishu-as-cms.md'
   ```
   其余 6 期同法，标题取上表，内容文件按期对应
3. **创建位置**：不传 `--parent-token`，默认创建到飞书云文档根目录（feishu-sync 可扫描位置）
4. **所需 scope**：`docx:document:create docs:document.media:upload docx:document:write_only docx:document:readonly`
5. **认证障碍记录**：总编侧两次发起设备码授权（user_code MSZ5-UABL / DV8T-9BZN 均已过期），`--device-code` 轮询因超时中断，按用户指示移交主会话接管认证
6. **备选**：若主会话认证仍不可用，可手动上传——飞书网页版新建文档，标题用上表，正文粘贴 `blog-series/.upload/` 对应文件内容，保存到「我的空间」根目录即可被同步器扫描

## 三、上传结果（主会话执行，2026-10-02 00:5x）

认证经主会话 `lark-cli auth login --device-code` 完成交换（user 身份 verified）后，7 篇全部创建成功（根目录，同步器可扫描）：

| 期 | 飞书文档 |
|---|---------|
| 1 | https://ilibgnff7f.feishu.cn/docx/DhlPdEqfEoUs7mx3opDc5w4mnMb |
| 2 | https://ilibgnff7f.feishu.cn/docx/NIMEdhytZogyCsxxBrQcyKkznUL |
| 3 | https://ilibgnff7f.feishu.cn/docx/J48vdltBGoOMTBxGUdicsaEXnzZ |
| 4 | https://ilibgnff7f.feishu.cn/docx/SKIMdO9GyoudhFxA9Jpc1MgSnPf |
| 5 | https://ilibgnff7f.feishu.cn/docx/IpbqdT6b1oDjmVxknyec7Cv2nUg |
| 6 | https://ilibgnff7f.feishu.cn/docx/MFhTdL3mDoo41AxsboYc5Zg7nEd |
| 7 | https://ilibgnff7f.feishu.cn/docx/YiAGdAb2ao8vqexuRkJcd2aonfe |

**后续**：明早 cron（UTC 01:00，常滞后数小时）自动增量同步 → R2 → ISR 上线；急发可 `gh workflow run feishu-sync.yml --ref main` 手动触发。

## 四、去 AI 味二轮改造（2026-10-02）

用户反馈叙事结构有 AI 痕迹，依 [humanizer-zh] 与 [shuorenhua] 两个 skill + 微信参考文风，对全部 7 篇做结构性重写（`structural` 授权）：

- **拆掉七段式编号模板**（一、这期解决什么问题/二、背景/三、别人怎么做……），改为按各自「事情线」叙事
- 每篇按其内容选择叙事骨架：p1/p2 数字冲突开头、p3 安全故事线、p4 需求反差、p5 心虚坦白+三板斧、p6 排障时间线、p7 故障时间线（发现→诊断→三故障→修复→彩蛋）
- 删除预告腔/总结腔/方法论解说腔；p5 坑一与板斧二内容重复已合并
- **保真红线未破**：全部数字（163 篇/1h40m/60min/8-23 停更/1h37m 追赶/1h40m31s 全量）、时间线事实、代码块、Mermaid 图、对比表原样保留
- 飞书 7 篇全部原位更新（p1 rev7，其余 rev5），链接不变

## 五、分类归属与上线（2026-10-02）

- 7 篇移入飞书 AI 分类文件夹（SsRkfi9lbliHBFdcSWAcXmxUnrd），出现在首页文章流 + AI 分类页（/category/ai）
- 增量同步 run 36949274887 成功，articles.json 7 篇入库（cat=ai，中文 slug）
- 线上验证：文章页 200（标题正确）；路由走 next-intl as-needed（/zh/article/x → /article/x）
