/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import {
  Rocket,
  Bot,
  Database,
  GraduationCap,
  Mail,
  Globe,
  MapPin,
  ArrowUpRight,
  Award,
  BookOpen,
  BadgeCheck,
  Trophy,
  FileText,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '李自在 · 个人简历',
  description:
    '7 年数据与 AI 工程经验：淘宝搜推算法、阿里云政企 FDE 交付、城市交通大数据。深耕生产级 AI Agent 系统、LLMOps 治理与百亿级数据架构。求职方向：Forward Deployed Engineer / 数据研发（AI + Data）。',
  openGraph: {
    title: '李自在 · 个人简历',
    description:
      '7 年数据与 AI 工程经验 · 生产级 Agent 系统 · 百亿级数据架构 · FDE 全链路交付',
  },
};

/* ------------------------------------------------------------------ */
/* 富文本：**加粗** 与 `代码` 轻量解析（简历原文标记直译）                */
/* ------------------------------------------------------------------ */

function rich(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-background border border-border px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ------------------------------------------------------------------ */
/* 数据 — 文字均取自简历原文，不做删减                                  */
/* ------------------------------------------------------------------ */

const PROFILE = {
  name: '李自在',
  pseudonymNote: '化名',
  headline: '高级数据工程师 → Forward Deployed Engineer',
  direction: 'Forward Deployed Engineer (AI Agent / 交付方向) ｜ 数据研发（AI + Data 方向） ｜ 资深数据工程师',
  intro:
    '7 年数据与 AI 工程经验，横跨淘宝搜推算法、阿里云政企解决方案与城市交通大数据。既能在客户现场把复杂业务解构为可落地的数据方案，也能独立打造生产级 AI Agent 商业化产品——从 POC 到生产部署，从百亿级数仓到 Token 成本治理，喜欢解决「难而具体」的问题。',
  email: '1914131366@qq.com',
  blog: 'https://lizizai.xyz/',
  location: '杭州 / 远程 / 全国',
  updated: '2026.09',
};

const STATS = [
  { value: '7', unit: '年', label: '数据与 AI 工程全链路经验' },
  { value: '4', unit: '城', label: '城市大脑专有云项目交付' },
  { value: '9', unit: '×', label: '核心查询 P99 延迟优化降幅' },
  { value: '60', unit: '%+', label: '常规研发迭代周期缩短' },
];

const STRENGTHS = [
  {
    icon: Rocket,
    title: '全链路 FDE 交付与政企大客户落地',
    body:
      '**7 年**数据与 AI 工程经验，横跨**淘宝搜推算法、阿里云政企解决方案与城市交通大数据**。主导 **4 个城市大脑专有云项目交付与 5 个专有云项目运维**，具备极强的“业务解构 → 方案架构 → 原型验证（POC） → 生产部署 → 标准产品化沉淀”全周期交付能力，擅长在复杂客户现场与网络强隔离规范下解决数据融合与系统迁移难题。',
  },
  {
    icon: Bot,
    title: '生产级 Agent 系统与 LLMOps 治理',
    body:
      '具备独立打造商业化 AI Agent 产品的端到端落地经验。精通基于 **LangGraph** 编排长生命周期、含持久化状态管理与**人机协同（HITL）**的复杂状态机工作流；深入掌握 **Agentic Graph RAG**、两阶段 CoT 输出约束及自生长 **LLM Wiki** 检索体系；建立以 **Langfuse** 为底座的全链路 Trace、Redis 滑动窗口防击穿限流与 Token 成本裁剪的 LLMOps 治理闭环。',
  },
  {
    icon: Database,
    title: '百亿级 / PB 级数据架构与极致性能调优',
    body:
      '精通 **MaxCompute、Spark、Hologres、PostgreSQL** 等计算与 OLAP 存储引擎，具备复杂业务场景下的数仓分层建模（雪花/OBT宽表）与元数据治理能力；擅长海量数据计算调优（MapJoin 裁剪、Bitmap 位图索引加速、长尾 HotKey 治理），具备将核心查询 **P99 延迟降低 9 倍、排查耗时由小时级缩短至分钟级** 的工业级攻坚经验。',
  },
  {
    icon: GraduationCap,
    title: '端到端全栈工程力与高壁垒综合素质',
    body:
      '熟练掌握 **Python (FastAPI) + React** 全栈开发，具备基于 Docker/K8s 的容器化交付能力；持有 **PMP 项目管理认证**；拥有极强的科研创新能力与工程理论根基，**以第 1 发明人获授权发明专利 1 项，发表 SCI/EI/中文核心学术论文 4 篇**。',
  },
];

const EXPERIENCE = [
  {
    period: '2024.01 - 至今',
    company: '淘宝（中国）软件有限公司',
    dept: '搜推算法技术事业部',
    role: '高级数据工程师（AB 实验平台 / 数据科学方向）',
    logo: '/resume/taobao.svg',
    logoAlt: '淘宝',
    desc: '负责淘宝直播、逛逛等内容化场域日均百亿级曝光与实验日志的 OLAP 数仓架构设计、在离线统一打标系统重构及性能调优；主导落地 AI 赋能的研发工作流 Agent 与智能血缘问答平台。',
  },
  {
    period: '2021.08 - 2023.12',
    company: '阿里云计算有限公司',
    dept: '政企解决方案事业部',
    role: '高级数据工程师 / 数据交付负责人（FDE 方向）',
    logo: '/resume/alibabacloud.svg',
    logoAlt: '阿里云',
    desc: '主导城市大脑交通全网模型数据底座与孪生计算平台的架构设计与专有云大客户交付；负责现场技术攻坚、数据迁移融合与方案标准化产品化输出。',
  },
  {
    period: '2019.07 - 2021.08',
    company: '深圳市城市交通规划设计研究中心',
    dept: '',
    role: '交通大数据工程师',
    monogram: '交',
    desc: '负责城市级多源交通海量数据 ETL 架构与实时交通拥堵指数系统的核心算法工程落地。',
  },
];

const PROJECTS = [
  {
    no: '01',
    name: 'DataEng-Twin · 面向数据研发的 7×24h 自主「数字分身」与自进化知识平台',
    period: '2026.03 - 至今',
    role: '核心架构师 & 算法工程开发',
    desc: '针对数据团队在日常研发中存在的“重复性需求多、跨表血缘黑盒、业务群聊答疑耗时、专家经验散落流失”等痛点，独立架构并落地了**具备领域专家知识、可 7×24h 自主运行的数据工程师“数字分身（Digital Worker）”平台**。将代码生成、血缘溯源、知识沉淀等能力原子化封装为 **Agent Skills**，融合**五级知识图谱、自生长 LLM Wiki 与双轨混合检索**，实现数据研发全流程自治与全天候答疑。',
    attacks: [
      {
        title: '数字分身 Skill 技能集抽象与 7×24h 常驻调度架构',
        points: [
          '将资深数据工程师的核心工作流抽象为标准化、可插拔的 **Agent Skill 技能库**（涵盖 `Requirement-Parser` 需求分流、`Pipeline-Generator` 代码生成、`Lineage-Tracer` 血缘溯源、`QA-Assistant` 智能答疑）；',
          '设计轻量级常驻调度引擎与上下文管理器，支持本地常驻及云端 **7×24h 自动化无人值守托管**，常规指标/维度需求实现全自动闭环交付，**使常规研发迭代周期缩短 60%+**。',
        ],
      },
      {
        title: '结构化记忆中枢：异构代码解析与五级图谱（GraphRAG）',
        points: [
          '针对生产环境中 Python、SQL 混合的多语言异构代码，设计基于 **Few-Shot + 上下文注入的专用提示词提取流水线**，鲁棒提取字段级计算逻辑与业务生产语义；',
          '在 **Neo4j** 中构建“业务场景 → Pipeline → 任务节点 → 表元数据 → 字段元数据”**五级长期记忆图谱**；重构传统 ReAct 模式为“意图抽取 + 确定性 Cypher 遍历工具”，**将多跳血缘推理步骤压缩 50%+，跨表血缘问答准确率达 95%+**。',
        ],
      },
      {
        title: '非结构化自生长知识库（LLM Wiki）与双轨混合检索',
        points: [
          '提出 **LLM Wiki 架构**，将业务经验文档、数仓模型规范与排障 SOP 抽象为实体 Wiki 与概念 Wiki；',
          '**自动化知识挖掘与自进化**：定期采集业务协作群聊记录，基于 LLM 自动提取高频 QA 对，并按**语义相似度聚类合并**为专题 Wiki 页面，实现知识资产的“无人值守自生长”；',
          '**双轨混合检索体系**：构建“**BM25 关键词精确匹配 + 稠密向量（Dense Embedding）语义检索**”并行召回架构，配合加权融合排序与 Web Search 兜底，严格控制切片在 Embedding 最大窗口内以避免上下文割裂，大幅提升业务问答的响应精度。',
        ],
      },
      {
        title: '经验沉淀闭环与全链路 LLMOps 治理',
        points: [
          '建立知识正向反馈循环：在每次研发任务确认与代码上线后，自动提取模型设计模式与业务口径，增量回流至本地知识库，实现数字分身专业能力的持续自进化；',
          '深度集成 **Langfuse** 构建 LLMOps 监控底座，实时追踪 Skill 调用成功率、检索命中率与 Token 消耗，保障数字分身长周期自治运行的稳定性与低成本。',
        ],
      },
    ],
    stack: ['Python', 'FastAPI', 'Neo4j', 'LangGraph / LangChain', 'LiteLLM', '混合双轨检索', '提示词工程', 'Langfuse'],
  },
  {
    no: '02',
    name: 'Roadmap Agent · 基于 LangGraph 的高可靠自适应学习多智能体平台',
    period: '2026.01 - 2026.05',
    role: '独立全栈架构师 & 核心开发者（商业化落地项目）',
    link: { href: 'https://www.fastlearning.app', label: 'fastlearning.app' },
    desc: '针对生成式 AI 在复杂学习路径规划中存在的“长链条易中断、非标 JSON 输出崩溃、状态漂移与高幻觉率”等落地痛点，独立设计并交付生产级自适应多智能体平台。基于 **Harness 工程哲学** 构建“目标拆解 → 路径规划 → 对抗审查 → 内容自适应生成”的确定性工作流，实现端到端高可靠的个性化学习交付。',
    attacks: [
      {
        title: '复杂状态机编排与人机协同（HITL）',
        points: [
          '基于 **LangGraph** 架构设计 5 个专业 Agent 协同的拓扑状态机，引入 `AsyncPostgresSaver` 实现全局 `ThreadState` 异步持久化，自研 `SideEffectCoordinator` 统一调度工作流副作用，实现长生命周期任务的**无损断点续传与人机协同（Human-in-the-Loop）状态回滚**；',
          '引入结构化意图识别与多轮动态澄清机制，将用户模糊自然语言指令的意图解析准确率从 **40% 提升至 85%**，从源头抑制长上下文下的状态漂移。',
        ],
      },
      {
        title: '两阶段思维链（Two-Stage CoT）与泛型确定性约束',
        points: [
          '为根治 LLM 在复杂逻辑下的格式幻觉，工程化设计**两阶段 CoT 提取流水线**，在架构层面彻底解耦“发散推理（Reasoning）”与“结构化输出（Formatting）”；',
          '搭建 **Pydantic + Protocol** 端到端类型约束体系，结合**对抗性审查 Agent（Adversarial Critic）** 与确定性代码路由，对非标输出进行强制拦截与自愈重试，实现业务侧 **0 运行时 JSON 解析崩溃**。',
        ],
      },
      {
        title: 'LLMOps 可观测体系与高并发防御',
        points: [
          '搭建“FastAPI 异步网关 + Celery 任务队列 + Redis 缓存 + 分布式滑动窗口”四层高可用机制，平抑并发流量并解决多进程下外部 API 配额争抢，使外部 **LLM 调用成功率稳定在 100%**；',
          '深度集成 **Langfuse** 构建 LLMOps 治理闭环，实现从 Agent 节点流转、Prompt 演进到底层 Token 消耗的毫秒级全链路 Trace 追踪与异常告警。',
        ],
      },
      {
        title: '模型分流路由（Model Cascading）与 Token 成本极致裁剪',
        points: [
          '设计**异构模型分流调度策略**（意图判断/格式审查路由至轻量级模型，复杂生成路由至高参大模型）；',
          '研发基于 Content-Hash 的**原子级节点重试机制**（异常仅重试最小故障节点而非全流重跑），结合 Context 动态剪枝，将单个任务生命周期的 **Token 调用成本降低 35%+**。',
        ],
      },
    ],
    stack: ['Python (FastAPI)', 'LangGraph', 'LiteLLM', 'PostgreSQL (AsyncPostgresSaver)', 'Redis', 'Celery', 'Langfuse', 'Next.js 14', 'Docker'],
  },
  {
    no: '03',
    name: '面向敏捷 AB 实验的百亿级 OLAP 数仓与在离线打标平台建设',
    period: '2024.01 - 至今',
    role: '数仓架构师 & 内容场域 AB 实验数据负责人（淘宝搜推算法）',
    desc: '为支撑淘宝直播、逛逛等三大内容化 BU 日均**百亿级曝光与分流日志**的高并发 AB 实验分析，主导搭建高性能数仓与数据服务平台。针对“老旧打标系统年久失修且无法溯源、高频配置易报错、PB 级关联查询慢、实验样本污染（SRM）排查难”等痛点，完成从在离线打标平台重构、数仓建模调优到自动化归因流水线的端到端建设。',
    attacks: [
      {
        title: '主导重构在离线统一打标平台（覆盖用户/商品/Query 实体）',
        points: [
          '**配置期即时校验与离线批量预检**：设计“规则配置即时静态校验 + Python 并行化批量预检”双层拦截机制，在任务提交第一时间感知并拦截非标 SQL 与语法/逻辑冲突，**将规则配置导致的运行报错率降至近 0**；',
          '**全链路生产溯源与状态透明化**：自研**标签溯源监控模块**，实现标签生产拓扑、计算进度与生效状态的全流程可视化透视，彻底解决标签生效黑盒难题，大幅提升高频打标需求的交付与排查效率。',
        ],
      },
      {
        title: '分层混合数仓建模与半结构化动态 Schema 演进',
        points: [
          '采用“雪花模型规范层 + OBT 大宽表加速层”架构，落地元数据驱动的自动化接入体系，**实现新数据源 90% 的自动化配置接入**；',
          '针对算法实验参数高频变更痛点，引入 **Hologres JSONB 半结构化列存方案**，避免频繁 DDL 改表发布成本，同时保持列式裁剪与谓词下推的高效查询能力。',
        ],
      },
      {
        title: 'PB 级计算与存储极限性能调优（P99 延迟降低 9 倍）',
        points: [
          '针对大规模分布式计算长尾与数据倾斜，深度调优物理执行计划：实施 **MapJoin 动态小表广播裁剪、Hologres Bitmap 位图索引过滤加速与 HotKey 分盐打散策略**；',
          '核心底表产出时间由上午 10:00 **提前至清晨 6:00**，多维交互式分析 **P99 查询延迟降低 9 倍，计算峰值内存占用降低 16 倍**，零故障平稳支撑大促流量洪峰。',
        ],
      },
      {
        title: 'AB 实验样本污染（SRM）自动化归因与统一认证标准',
        points: [
          '自主研发插件化 SRM 排查流水线，打通调度引擎与 MaxCompute 计算集群，实现“异常探针感知 → 根因自动下钻 → 报告一键生成”，**将排查耗时由小时级压缩至分钟级**；',
          '主导直播与内容场域“数据统一行动”，拉通算法、产品、BI 建立统一数据认证机制，**消除 95% 的跨部门口径歧义**。',
        ],
      },
    ],
    stack: ['MaxCompute', 'Hologres', 'SQL / HQL', 'Python', 'DataWorks'],
  },
  {
    no: '04',
    name: '城市大脑与孪生计算平台 · 专有云大客户部署与全链路交付',
    period: '2021.08 - 2023.12',
    role: '数据架构与交付负责人（阿里云 · FDE 核心旗舰项目）',
    desc: '针对智慧城市与交通行业大客户在专有云环境下存在的“数据异构割裂、算子研发分散难复用、网络物理隔离、交付定制成本高”等痛点，主导城市大脑数据底座与孪生计算引擎的方案设计与现场交付。负责从**客户业务解构、专有云数仓架构设计、孪生算子云原生服务化封装，到现场联合攻坚与标准化产品沉淀**的全生命周期交付闭环。',
    attacks: [
      {
        title: '专有云全流程交付与现场攻坚（FDE 客户侧核心落地）',
        points: [
          '主导完成**重庆 TOCC（交通运行协调指挥中心）二期、杭州交通强国等 4 个专有云重点项目交付与 5 个项目运维**；',
          '深入客户现场，在严格的**网络物理隔离与专有云安全合规要求**下，与客户工程团队联合制定数据迁移与多源数仓融合方案，解决多团队数据架构不统一的现场难题；',
          '基于 **Airflow** 搭建客户环境仿真数据 Mock 流水线，实现复杂场景的前置无损联调，**将大客户现场交付与验收周期缩短 30%+**。',
        ],
      },
      {
        title: '行业级 OneData 体系与数仓架构设计',
        points: [
          '深入交通行业 6 大核心业务域（道路运行、安全管控、公共出行等），基于**阿里巴巴 OneData 规范与维度建模方法**，构建规范化 DWD/DWS/ADS/DIM 数仓分层；',
          '打通“业务场景 → 指标体系 → 表模型 → 物理字段”的映射链路，搭建贯穿全层级的数据质量校验与实时断流/延迟监控告警体系，作为核心数据底座稳定支撑城市级指挥调度。',
        ],
      },
      {
        title: '孪生计算算子云原生服务化与动态编排流水线',
        points: [
          '针对多研发环境下算子割裂、无法复用的痛点，依托 **K8s 容器化技术**实现核心计算算子的标准化、在线化与服务化封装；',
          '设计并交付覆盖算子全生命周期的 15 个核心 RESTful 接口，通过版本号与唯一约束保障**高并发下的接口幂等性与事务一致性**；',
          '打通 OSS 与 DataWorks 调度链路，搭建算子统一动态编排流水线，灵活支撑 **30+ 孪生计算业务场景的按需组合调用，使业务算子重复开发成本降低 40%+**。',
        ],
      },
      {
        title: '交付方案产品化沉淀与跨项目规模化复制',
        points: [
          '践行“项目定制沉淀为通用产品”理念：主导制定多模式出行网络实体建模通用标准，抽象标准化数据字典、表模型模板与标准交付组件；',
          '该解决方案次年被评为**阿里云公司级成熟解决方案并在多个城市实现规模化复制交付**，大幅降低后续同类项目的定制开发与交付边际成本。',
        ],
      },
    ],
    stack: ['MaxCompute', 'DataWorks', 'K8s', 'Docker', 'Python / SpringBoot', 'PostgreSQL', 'Airflow', 'MySQL', 'OSS'],
  },
];

const SKILL_GROUPS = [
  {
    title: '大模型与 Agent 工程（主力强项）',
    en: 'LLM & Agent',
    items: [
      '精通基于 **LangGraph** 编排长生命周期、含状态持久化（ThreadState）与人机协同（HITL）的多智能体拓扑工作流；',
      '深入掌握 **Agentic Graph RAG** 架构、双轨混合检索（Dense + Sparse BM25）及基于 LLM Wiki 的知识自生长沉淀范式；',
      '掌握结构化提示词工程（Prompt Engineering / Few-Shot / CoT / 两阶段解析）及 Pydantic 运行时严格校验体系；',
      '精通基于 **Langfuse** 的生产级 LLMOps 治理闭环（全链路 Trace 监控、Token 成本核算、Prompt 版本管理）。',
    ],
  },
  {
    title: '海量数据架构与计算（底层基石）',
    en: 'Data Engineering',
    items: [
      '熟练掌握大规模离线计算与 OLAP 体系（MaxCompute / DataWorks / Spark / Hologres / PostgreSQL）；',
      '精通数仓分层建模方法论（OneData 规范、雪花模型、OBT 宽表）及元数据驱动治理体系；',
      '具备 PB 级海量数据计算调优实战经验（MapJoin 裁剪、Bitmap 位图索引优化、HotKey 倾斜分盐治理）。',
    ],
  },
  {
    title: '云原生交付与系统工程（FDE 交付与后端）',
    en: 'Cloud-native & Backend',
    items: [
      '掌握专有云/私有云网络隔离环境下的交付与数据迁移，具备容器化交付（Docker / K8s）能力；',
      '熟练使用 **Python (FastAPI)** 进行高性能异步后端开发，掌握 Celery 分布式任务队列与 Redis 滑动窗口限流；',
      '具备 **React / Next.js 14** 前端独立开发能力，能够端到端交付可用、高颜值的全栈 AI 商业化产品。',
    ],
  },
  {
    title: '现代 AI 辅助研发效能',
    en: 'AI-native Tooling',
    items: [
      '熟练运用 Claude Code、Cursor、Copilot 等 AI-Native 工具进行高质量原型构建、单元测试与代码重构。',
    ],
  },
];

const ACADEMICS = [
  {
    icon: Award,
    title: '授权发明专利 · 第 1 发明人',
    desc: '《共享单车淤积区域的识别方法、装置、设备及存储介质》（已授权；专利编号沟通时提供）',
  },
  { icon: BookOpen, title: '学术论文 4 篇', desc: '以第一作者 / 核心作者在交通与大数据领域发表 SCI / EI / 中文核心期刊论文 4 篇' },
  { icon: BadgeCheck, title: 'PMP 项目管理专业人士认证', desc: 'Project Management Professional' },
  { icon: Trophy, title: '专业竞赛获奖', desc: '大数据分析与应用方向专业竞赛获奖' },
];

const SECTION_NAV = [
  { href: '#strengths', label: '优势' },
  { href: '#experience', label: '经历' },
  { href: '#projects', label: '项目' },
  { href: '#education', label: '教育' },
  { href: '#skills', label: '技能' },
  { href: '#academic', label: '学术' },
  { href: '#contact', label: '联系' },
];

/* 项目配图 — diagram-design 技能生成（prototypes/resume-diagrams/*.html 源稿） */
const PROJECT_DIAGRAMS: Record<string, { src: string; alt: string; caption: string; width: number; height: number }> = {
  '01': {
    src: '/resume/detwin-arch.svg',
    alt: 'DataEng-Twin 平台架构图：需求与群聊输入经常驻调度引擎分发至四类 Agent Skill（需求分流、代码生成、血缘溯源、智能答疑），知识中枢含五级知识图谱与 LLM Wiki 双轨混合检索，底部为 Langfuse LLMOps 治理，虚线表示群聊自生长与经验沉淀回流',
    caption: 'FIG.01 · DataEng-Twin 平台架构',
    width: 1000,
    height: 604,
  },
  '02': {
    src: '/resume/roadmap-sm.svg',
    alt: 'Roadmap Agent 状态机：意图澄清、目标拆解、路径规划、对抗审查、内容生成五个状态顺序流转，对抗审查对非标输出拦截并自愈重试，虚线表示可中断进入 HITL 人工确认后续跑，以及 ThreadState 异步持久化检查点',
    caption: 'FIG.02 · Roadmap Agent 工作流状态机',
    width: 1000,
    height: 480,
  },
};

/* ------------------------------------------------------------------ */
/* 组件                                                                */
/* ------------------------------------------------------------------ */

function SectionHeading({ no, zh, en }: { no: string; zh: string; en: string }) {
  return (
    <div className="flex items-baseline gap-4 md:gap-5">
      {/* 大号衬线序号 — 本页的编辑式视觉锚点 */}
      <span className="font-serif text-3xl md:text-4xl font-black leading-none text-primary tabular-nums">
        {no}
      </span>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{zh}</h2>
      <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground/70">
        {en}
      </span>
      <span className="ml-2 h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}

function DiagramFigure({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}) {
  return (
    <figure className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
      {/* 移动端保证最小可读宽度，窄屏横向滚动；桌面端撑满 */}
      <div className="overflow-x-auto">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className="h-auto w-full min-w-[560px]"
        />
      </div>
      <figcaption className="flex items-center gap-2.5 border-t border-border px-4 py-3 md:px-6">
        <span className="h-px w-6 shrink-0 bg-primary" aria-hidden="true" />
        <span className="font-mono text-xs text-muted-foreground">{caption}</span>
      </figcaption>
    </figure>
  );
}

export default function ResumePage() {
  return (
    <div className="resume-root relative">
      {/* 入场动效 — 仅 transform/opacity，尊重系统减弱动效设置 */}
      <style>{`
        @keyframes resume-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .resume-rise { animation: resume-rise 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .resume-rise-1 { animation-delay: 0s; }
        .resume-rise-2 { animation-delay: 0.07s; }
        .resume-rise-3 { animation-delay: 0.14s; }
        @media (prefers-reduced-motion: reduce) {
          .resume-rise { animation: none; }
        }
        /* 锚点平滑滚动 — 仅本页挂载时生效，尊重系统减弱动效设置 */
        @media (prefers-reduced-motion: no-preference) {
          html:has(.resume-root) { scroll-behavior: smooth; }
        }
        /* 键盘焦点可见性（琥珀金 ring，页面级补充） */
        .resume-root a:focus-visible {
          outline: 2px solid var(--color-ring);
          outline-offset: 3px;
          border-radius: 4px;
        }
      `}</style>

      {/* ============================ Hero ============================ */}
      <section className="relative overflow-hidden border-b border-border">
        {/* 编辑感竖排水印 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none lg:block"
          style={{ writingMode: 'vertical-rl' }}
        >
          <span className="text-[11rem] leading-none font-black text-foreground/[0.028] tracking-[0.18em]">
            自在
          </span>
        </div>
        {/* 琥珀微光 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]"
        />

        <div className="container mx-auto max-w-6xl px-4 relative">
          <div className="py-16 md:py-24">
            <div className="resume-rise resume-rise-1 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px w-8 bg-primary" aria-hidden="true" />
              Resume · {PROFILE.updated}
            </div>

            <h1 className="resume-rise resume-rise-1 mt-8 flex flex-wrap items-end gap-x-6 gap-y-3">
              <span className="text-6xl md:text-8xl font-black tracking-tight leading-none">
                {PROFILE.name}
              </span>
              <span
                className="mb-2 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                title="李自在为笔名，正式姓名可在面试沟通中提供"
              >
                {PROFILE.pseudonymNote}
              </span>
            </h1>

            <p className="resume-rise resume-rise-2 mt-6 text-xl md:text-2xl text-foreground/90 font-medium text-balance">
              {PROFILE.headline}
            </p>
            <p className="resume-rise resume-rise-2 mt-3 text-sm md:text-[15px] text-primary/90">
              求职意向：{PROFILE.direction}
            </p>

            <p className="resume-rise resume-rise-2 mt-6 max-w-2xl text-[15px] md:text-base leading-[1.85] text-foreground/75 text-pretty">
              {PROFILE.intro}
            </p>

            <div className="resume-rise resume-rise-3 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <a
                href={`mailto:${PROFILE.email}`}
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="font-mono">{PROFILE.email}</span>
              </a>
              <a
                href={PROFILE.blog}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Globe className="h-4 w-4 text-primary" aria-hidden="true" />
                个人播客 / 作品集 · lizizai.xyz
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                {PROFILE.location}
              </span>
            </div>
          </div>

          {/* 数字速览 — DOM 中 dt 先于 dd（规范），视觉上数字在上 */}
          <dl className="grid grid-cols-2 border-t border-border md:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`flex flex-col py-8 pr-4 ${i > 0 ? 'md:border-l md:border-border md:pl-8' : ''} ${
                  i % 2 === 1 ? 'border-l border-border pl-6 md:pl-8' : ''
                } ${i > 1 ? 'max-md:border-t' : ''}`}
              >
                <dt className="order-2 mt-2 text-[13px] leading-5 text-muted-foreground">{s.label}</dt>
                <dd className="order-1 flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums">
                    {s.value}
                  </span>
                  <span className="text-lg font-semibold text-primary">{s.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ===================== 锚点导航（吸顶） ===================== */}
      <nav
        aria-label="简历目录"
        className="sticky top-16 z-40 border-b border-border bg-background/90 backdrop-blur print:hidden"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <ul className="scrollbar-hide flex items-center gap-5 overflow-x-auto py-3 text-[13px]">
            {SECTION_NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block whitespace-nowrap rounded-md px-1.5 py-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="container mx-auto max-w-6xl px-4">
        {/* ======================= 核心优势 — 编辑式编号列表（无卡片，与项目卡片区形成节奏对比） ======================= */}
        <section id="strengths" className="scroll-mt-32 py-16 md:py-20">
          <SectionHeading no="01" zh="核心优势" en="Strengths" />
          <div className="mt-8 divide-y divide-border">
            {STRENGTHS.map((s, i) => (
              <article
                key={s.title}
                className="grid gap-x-8 gap-y-3 py-8 first:pt-2 last:pb-0 md:grid-cols-[auto_1fr] md:gap-y-0 md:py-10"
              >
                <span className="font-serif text-4xl font-black leading-none text-primary tabular-nums md:text-5xl">
                  0{i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="flex items-start gap-2.5 text-lg md:text-xl font-bold">
                    <s.icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    {s.title}
                  </h3>
                  <p className="mt-4 max-w-3xl text-[15px] leading-[1.85] text-foreground/75 text-pretty">
                    {rich(s.body)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ======================= 工作经历 ======================= */}
        <section id="experience" className="scroll-mt-32 py-16 md:py-20">
          <SectionHeading no="02" zh="工作经历" en="Experience" />
          <ol className="relative mt-10 space-y-12 before:absolute before:bottom-2 before:left-[27.5px] before:top-2 before:w-px before:bg-border md:before:left-[31.5px]">
            {EXPERIENCE.map((e) => (
              <li key={e.company} className="relative pl-[72px] md:pl-[84px]">
                {/* 节点图标瓦片 */}
                <div className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-card md:h-16 md:w-16">
                  {e.logo ? (
                    <img
                      src={e.logo}
                      alt={`${e.logoAlt} logo`}
                      width={48}
                      height={48}
                      className="h-8 w-8 md:h-9 md:w-9"
                    />
                  ) : (
                    <span className="font-serif text-2xl font-bold text-primary">{e.monogram}</span>
                  )}
                </div>

                <div className="md:pt-1">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="text-xl font-bold">{e.company}</h3>
                    {e.dept && <span className="text-sm text-muted-foreground">{e.dept}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-mono text-[13px] text-muted-foreground">{e.period}</span>
                    <span className="text-primary">{e.role}</span>
                  </div>
                  <p className="mt-4 max-w-3xl text-[15px] leading-[1.85] text-foreground/75 text-pretty">
                    {e.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ======================= 核心项目 ======================= */}
        <section id="projects" className="scroll-mt-32 py-16 md:py-20">
          <SectionHeading no="03" zh="核心项目经历" en="Selected Projects" />
          <div className="mt-10 space-y-8">
            {PROJECTS.map((p) => (
              <article
                key={p.no}
                className="relative overflow-hidden rounded-lg border border-border bg-card p-6 md:p-10"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -top-7 select-none font-serif text-[7rem] font-black leading-none text-foreground/[0.05]"
                >
                  {p.no}
                </span>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <h3 className="max-w-3xl text-xl md:text-2xl font-bold text-balance">{p.name}</h3>
                  {p.link && (
                    <a
                      href={p.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 font-mono text-xs text-primary transition-colors hover:bg-primary/10"
                    >
                      {p.link.label}
                      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                  <span className="font-mono text-muted-foreground">{p.period}</span>
                  <span className="text-muted-foreground">{p.role}</span>
                </div>

                <p className="mt-5 max-w-3xl text-[15px] leading-[1.85] text-foreground/75 text-pretty">
                  {rich(p.desc)}
                </p>

                {/* 架构 / 状态机配图 */}
                {PROJECT_DIAGRAMS[p.no] && <DiagramFigure {...PROJECT_DIAGRAMS[p.no]} />}

                {/* 亮点分组 — lg 双栏排布，降低长列表的单栏压迫感 */}
                <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-2">
                  {p.attacks.map((a, ai) => (
                    <div key={a.title} className="relative border-l-2 border-border pl-5 md:pl-6">
                      <h4 className="flex items-baseline gap-3 text-[15px] md:text-base font-bold">
                        <span className="font-mono text-xs text-primary tabular-nums">
                          {p.no}.{ai + 1}
                        </span>
                        {a.title}
                      </h4>
                      <ul className="mt-3 space-y-2.5">
                        {a.points.map((pt) => (
                          <li
                            key={pt.slice(0, 24)}
                            className="flex gap-3 text-[14px] leading-[1.8] text-foreground/75 text-pretty"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-primary/70"
                            />
                            <span className="min-w-0">{rich(pt)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
                  {p.stack.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-border bg-background/60 px-2.5 py-1 font-mono text-xs text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* 指标一览 — 汇总各项目量化成果 */}
          <p className="mt-12 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-px w-8 bg-primary" aria-hidden="true" />
            Impact Overview
          </p>
          <DiagramFigure
            src="/resume/metrics-bar.svg"
            alt="核心工程指标优化幅度横条图：计算峰值内存降低 16 倍、P99 查询延迟降低 9 倍、常规研发迭代周期缩短 60%、算子重复开发成本降低 40%、Token 调用成本降低 35%、交付验收周期缩短 30%，各条目标注来源项目"
            caption="FIG.03 · 核心工程指标优化幅度（数据来自上述项目实测）"
            width={1000}
            height={480}
          />
        </section>

        {/* ======================= 教育背景 ======================= */}
        <section id="education" className="scroll-mt-32 py-16 md:py-20">
          <SectionHeading no="04" zh="教育背景" en="Education" />
          <div className="mt-10 rounded-lg border border-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                <span className="font-serif text-3xl font-bold text-primary">长</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-xl font-bold">长安大学（双一流高校 / 211）</h3>
                <p className="mt-1 text-sm text-muted-foreground">教育部直属 · 国部省共建</p>
              </div>
              <div className="ml-auto hidden text-right font-mono text-xs text-muted-foreground/70 sm:block">
                2012 — 2019
              </div>
            </div>
            <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[13px] text-muted-foreground">2016.09 - 2019.06 ｜ 硕士（保送）</p>
                <p className="mt-1.5 text-[15px] font-semibold">
                  主修方向：大数据分析、计算机应用、运筹学与统计学
                </p>
              </div>
              <div>
                <p className="font-mono text-[13px] text-muted-foreground">2012.09 - 2016.06 ｜ 本科</p>
                <p className="mt-1.5 text-[15px] font-semibold">长安大学</p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================= 专业技能 — 无卡片分栏（顶线分组，与优势区编辑式语言一致） ======================= */}
        <section id="skills" className="scroll-mt-32 py-16 md:py-20">
          <SectionHeading no="05" zh="专业技能清单" en="Skills" />
          <div className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {SKILL_GROUPS.map((g) => (
              <div key={g.title} className="border-t border-border pt-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-lg font-bold">{g.title}</h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60">
                    {g.en}
                  </span>
                </div>
                <ul className="mt-5 space-y-3">
                  {g.items.map((item) => (
                    <li
                      key={item.slice(0, 24)}
                      className="flex gap-3 text-[14px] leading-[1.8] text-foreground/75 text-pretty"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-primary/70"
                      />
                      <span className="min-w-0">{rich(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== 学术成果与资质 — 与技能区同语言的无卡片网格 ===================== */}
        <section id="academic" className="scroll-mt-32 py-16 md:py-20">
          <SectionHeading no="06" zh="学术成果与专业资质" en="Research & Credentials" />
          <div className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {ACADEMICS.map((a) => (
              <div key={a.title} className="border-t border-border pt-6">
                <div className="flex items-start gap-3">
                  <a.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold">{a.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-foreground/75 text-pretty">{a.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================= 联系 CTA ======================= */}
        <section id="contact" className="scroll-mt-32 pb-24 pt-4">
          <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-b from-primary/[0.08] to-transparent p-8 text-center md:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]"
            />
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Get in Touch</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight">
                正在寻找同路人
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-foreground/75 text-pretty">
                如果你的团队正在做 AI Agent 落地、数据基础设施，或需要一位能冲在客户一线的工程师，欢迎联系我：
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[PROFILE.direction.split('｜')[0].trim(), PROFILE.direction.split('｜')[1].trim(), PROFILE.direction.split('｜')[2].trim()].map(
                  (i) => (
                    <span
                      key={i}
                      className="rounded-full border border-border bg-card px-4 py-1.5 text-[13px] text-muted-foreground"
                    >
                      {i}
                    </span>
                  ),
                )}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href={`mailto:${PROFILE.email}?subject=来自%20lizizai.xyz%20的沟通意向`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-200 hover:bg-[#f59e0b] active:scale-[0.96]"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  发邮件联系
                </a>
                <a
                  href={PROFILE.blog}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-[color,border-color,transform] duration-200 hover:border-primary/50 hover:text-primary active:scale-[0.96]"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  逛逛我的博客
                </a>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center font-mono text-xs text-muted-foreground/60">
            简历更新于 {PROFILE.updated} · 本页经历基于真实工作整理，联系方式与身份细节已做脱敏处理
          </p>
        </section>
      </div>
    </div>
  );
}
