import Image from 'next/image';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Briefcase, Package, Database, Landmark } from 'lucide-react';
import ResumeBeams from '@/components/resume/ResumeBeams';

export const metadata: Metadata = {
  title: '李自在 · 个人简历',
  description:
    '数据与 AI 自媒体博主 · 7 年工程经验。生产级 Agent 系统、PB 级数据底座、政企大客户交付。曾任职阿里云、淘宝。',
  openGraph: {
    title: '李自在 · 数据与 AI 自媒体博主',
    description: '7 年工程经验 · 生产级 Agent 系统 · PB 级数据底座 · 政企大客户交付',
  },
};

/* 确定性伪随机：尘埃粒子在服务端生成固定结果，避免 hydration 抖动 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DUST = (() => {
  const rand = mulberry32(20260930);
  return Array.from({ length: 56 }, () => ({
    x: Math.round(300 + rand() * 1000),
    y: Math.round(30 + rand() * 480),
    r: (rand() * 1.6 + 0.6).toFixed(1),
    o: (rand() * 0.45 + 0.4).toFixed(2),
  }));
})();

/* 刻度盘：30 根径向刻度，前 18 根亮橙 */
const TICKS = Array.from({ length: 30 }, (_, i) => {
  const a = (i / 30) * Math.PI * 2 - Math.PI / 2;
  const r1 = 26;
  const r2 = 33;
  return {
    x1: 36 + r1 * Math.cos(a),
    y1: 36 + r1 * Math.sin(a),
    x2: 36 + r2 * Math.cos(a),
    y2: 36 + r2 * Math.sin(a),
    lit: i < 18,
  };
});

/* 数仓数据血缘：源 -> 湖 -> 仓 -> 应用（cx/cy 为节点中心） */
const LINEAGE = {
  nodes: [
    { label: '业务库', cx: 60, cy: 45, tier: 'source' },
    { label: '日志埋点', cx: 60, cy: 100, tier: 'source' },
    { label: '外部数据', cx: 60, cy: 155, tier: 'source' },
    { label: '数据湖 ODS', cx: 240, cy: 100, tier: 'core', w: 88 },
    { label: 'DWD 明细', cx: 375, cy: 55, tier: 'dw' },
    { label: 'DWS 汇总', cx: 375, cy: 145, tier: 'dw' },
    { label: 'BI 报表', cx: 535, cy: 45, tier: 'app' },
    { label: 'AI 特征', cx: 535, cy: 105, tier: 'app' },
    { label: '数据服务', cx: 535, cy: 165, tier: 'app' },
  ],
  edges: [
    { d: 'M94 45 C 160 45 150 100 206 100' },
    { d: 'M94 100 C 150 100 150 100 206 100' },
    { d: 'M94 155 C 160 155 150 100 206 100' },
    { d: 'M274 100 C 300 100 315 55 341 55', flow: true },
    { d: 'M274 100 C 300 100 315 145 341 145' },
    { d: 'M409 55 C 445 55 465 45 501 45' },
    { d: 'M409 55 C 445 55 465 105 501 105', flow: true },
    { d: 'M409 145 C 445 145 465 105 501 105' },
    { d: 'M409 145 C 445 145 465 165 501 165', flow: true },
  ],
} as const;

const TIMELINE: { year: string; title: string; desc: string; tags: string[]; current?: boolean }[] = [
  {
    year: '2019',
    title: '入行 · 城市交通大数据',
    desc: '城市级多源交通数据 ETL 架构，实时拥堵指数系统的核心算法工程落地。',
    tags: ['海量 ETL', '实时指数'],
  },
  {
    year: '2021',
    title: '阿里云 · FDE',
    desc: '城市大脑交通数据底座与孪生计算平台架构，专有云政企大客户现场交付。',
    tags: ['数据底座', '孪生平台', '政企交付'],
  },
  {
    year: '2024',
    title: '淘宝 · 数据工程',
    desc: '在离线统一打标平台与 AB 实验体系，PB 级链路性能深度调优。',
    tags: ['数仓架构', 'AB 实验', 'P99 ↓9×'],
  },
  {
    year: '2026',
    title: '独立开发 · 自媒体',
    desc: '生产级 Agent 系统落地与 GraphRAG 记忆中枢，持续输出数据与 AI 内容。',
    tags: ['Agent 工程', 'GraphRAG', '内容创作'],
    current: true,
  },
];

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="rz-page rz-grain min-h-screen">
      <div className="relative mx-auto max-w-[1344px] px-6 md:px-12">
        {/* Hero 大卡 */}
        <header className="rz-card rz-hud relative mt-12 flex min-h-[560px] items-stretch overflow-hidden"><i className="rz-port" aria-hidden="true" />
          <div className="pointer-events-none absolute rounded-full" style={{ left: -560, top: -60, width: 1100, height: 1100, border: '1px solid rgba(255,200,150,.14)' }} />
          {/* 层1: 大范围暖光 */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(680px 480px at 72% 48%, rgba(255,130,20,.24), transparent 70%)' }}
          />
          {/* 层2: Hero 内 PCB 走线 + 光柱 + 城市剪影 + 尘埃 */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1344 560" preserveAspectRatio="none" aria-hidden="true">
            <g stroke="rgba(205,135,55,.85)" strokeWidth="1" fill="none">
              <path d="M0 90 H150 L185 125 H320" />
              <path d="M0 210 H70 L100 240 H130" />
              <path d="M1344 120 H1240 L1205 155 H1140" />
              <path d="M1344 460 H1220 L1185 495 H1080" />
              <path d="M980 0 V70 L1010 100 V150" />
              <path d="M420 560 V510 L390 480 H330" />
            </g>
            <g fill="#D98A35">
              <circle cx="320" cy="125" r="3" /><circle cx="130" cy="240" r="3" /><circle cx="1140" cy="155" r="3" />
              <circle cx="1080" cy="495" r="3" /><circle cx="1010" cy="150" r="3" /><circle cx="330" cy="480" r="3" />
            </g>
            <g stroke="rgba(255,140,40,.18)" strokeWidth="2">
              <line x1="880" y1="360" x2="880" y2="560" /><line x1="905" y1="300" x2="905" y2="560" />
              <line x1="930" y1="400" x2="930" y2="560" /><line x1="855" y1="440" x2="855" y2="560" />
            </g>
            <g opacity=".5">
              <path d="M0 560 V528 H40 V508 H70 V536 H120 V496 H160 V522 H210 V484 H250 V540 H300 V512 H340 V530 H400 V500 H430 V560 Z" fill="#050302" />
              <path d="M700 560 V532 H740 V500 H770 V528 H820 V492 H860 V538 H910 V516 H950 V560 Z" fill="#050302" />
              <path d="M1000 560 V526 H1040 V506 H1080 V534 H1130 V498 H1170 V560 Z" fill="#050302" />
              <g fill="rgba(255,150,50,.5)">
                <circle cx="55" cy="516" r="1.2" /><circle cx="130" cy="505" r="1.2" /><circle cx="175" cy="530" r="1.2" />
                <circle cx="222" cy="492" r="1.2" /><circle cx="750" cy="512" r="1.2" /><circle cx="832" cy="502" r="1.2" />
                <circle cx="1050" cy="516" r="1.2" /><circle cx="1140" cy="510" r="1.2" />
              </g>
            </g>
            <g fill="rgba(255,190,120,.7)">
              {DUST.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={d.r} opacity={d.o} />
              ))}
            </g>
          </svg>
          {/* 层3: 人像 + 三层光环 */}
          <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[55%] md:block">
            <div className="absolute right-[4%] top-1/2 h-[780px] w-[780px] -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,122,0,.3) 0%, rgba(255,122,0,.08) 45%, transparent 70%)' }} />
            <div className="absolute right-[4%] top-1/2 h-[410px] w-[410px] -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,150,60,.16) 0%, transparent 62%)' }} />
            <div className="absolute right-[4%] top-1/2 h-[410px] w-[410px] -translate-y-1/2 rounded-full" style={{ border: '2.5px solid #FFB25E', boxShadow: '0 0 24px rgba(255,178,94,.75),0 0 70px rgba(255,122,0,.4),inset 0 0 30px rgba(255,150,60,.25)' }} />
            <div className="absolute right-[4%] top-1/2 h-[410px] w-[410px] -translate-y-1/2 rounded-full blur-[7px]" style={{ border: '2px solid rgba(255,178,94,.5)' }} />
            <Image
              src="/resume/hero-portrait.webp"
              alt="李自在"
              width={864}
              height={1152}
              priority
              sizes="(max-width: 768px) 0px, 864px"
              className="absolute bottom-0 right-0 h-[96%] max-w-none object-contain"
              style={{ filter: 'brightness(1.18) saturate(1.4) drop-shadow(0 0 28px rgba(255,140,40,.32))', WebkitMaskImage: 'linear-gradient(90deg,transparent 0,#000 18%),linear-gradient(180deg,#000 82%,transparent 100%)', WebkitMaskComposite: 'source-in', maskImage: 'linear-gradient(90deg,transparent 0,#000 18%),linear-gradient(180deg,#000 82%,transparent 100%)', maskComposite: 'intersect' }}
            />
          </div>
          {/* 竖排文字组 */}
          <div className="absolute right-16 top-[14%] z-10 hidden flex-col items-end gap-7 xl:flex">
            <span className="rz-glow block h-[3px] w-12 bg-[var(--rz-orange)]" />
            <div className="rz-vertical text-[21px] font-bold" style={{ color: '#F2DFC0' }}>
              数据<span className="rz-glow mx-[3px] inline-block h-[5px] w-[5px] rotate-45 bg-[var(--rz-orange)] align-middle" />AI<span className="rz-glow mx-[3px] inline-block h-[5px] w-[5px] rotate-45 bg-[var(--rz-orange)] align-middle" />内容<span className="rz-glow mx-[3px] inline-block h-[5px] w-[5px] rotate-45 bg-[var(--rz-orange)] align-middle" />成长
            </div>
            <div className="text-right font-mono text-[12px] leading-[2.1] tracking-[.22em]" style={{ color: '#A08B70' }}>
              <p>BETTER DATA</p>
              <p>BETTER DECISIONS</p>
            </div>
          </div>
          {/* 左列文字 */}
          <div className="relative z-10 flex max-w-[560px] flex-col justify-center gap-5 py-14 pl-8 md:pl-[72px]">
            <div className="flex items-center gap-4">
              <h1 className="text-6xl font-black tracking-tight">李自在</h1>
              <span className="rounded-full px-3 py-1 text-[14px] font-bold" style={{ background: 'linear-gradient(180deg,#FFB03A,#F68E1E)', color: '#241303' }}>笔名</span>
            </div>
            <h2 className="text-[34px] font-bold leading-tight text-white md:text-[36px]">数据与 AI 自媒体博主</h2>
            <div className="mt-1 flex items-center gap-2.5 text-[16px]" style={{ color: '#C8CDD2' }}>
              <Briefcase className="h-[18px] w-[18px]" style={{ color: 'var(--rz-orange)' }} strokeWidth={1.8} />
              <span>7 年工程经验</span>
            </div>
            <div className="mt-1 flex items-center gap-5">
              <span className="text-[13px]" style={{ color: 'var(--rz-t-muted)' }}>曾任职于</span>
              <span className="flex items-center gap-2.5">
                <Image src="/resume/alibabacloud.svg" alt="阿里云" width={32} height={32} className="h-8 w-8" />
                <span className="text-[15px] font-medium text-white">阿里云</span>
              </span>
              <span className="flex items-center gap-2.5">
                <Image src="/resume/taobao.svg" alt="淘宝" width={36} height={36} className="h-9 w-9" />
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <a href="#work" className="rz-btn-main">查看项目经历 <span>→</span></a>
              <a href="#contact" className="rz-btn-ghost">订阅博客</a>
            </div>
          </div>
        </header>

        {/* Bento 主网格 */}
        <main id="rz-work" className="relative mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <ResumeBeams />

          {/* 左列：三张项目卡 */}
          <div className="flex flex-col gap-6">
            {/* 卡1 生产级 Agent 系统 */}
            <section className="rz-card flex flex-col lg:h-[436px]" data-beam="agent">
              <svg className="pointer-events-none absolute bottom-0 left-0 w-[200px]" viewBox="0 0 220 140" fill="none" aria-hidden="true" style={{ opacity: 0.4 }}>
              <g stroke="rgba(255,160,45,.4)" strokeWidth="1">
                <path d="M0 112 H70 L92 90 H124" /><path d="M0 88 H50 L72 66" /><path d="M24 140 V118 L46 96" />
              </g>
              <g fill="rgba(255,170,60,.55)">
                <circle cx="124" cy="90" r="2" /><circle cx="72" cy="66" r="2" /><circle cx="46" cy="96" r="2" />
              </g>
            </svg>
            <div className="flex items-center justify-between gap-6">
              <h3 className="text-2xl font-bold" style={{ textShadow: '0 0 18px rgba(255,255,255,.15)' }}>生产级 Agent 系统</h3>
              <span className="rz-chip"><Package className="h-[34px] w-[34px]" style={{ color: 'var(--rz-orange)' }} strokeWidth={1.6} /></span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--rz-t-body)' }}>基于大模型的企业级 Agent 平台，支持多智能体协作、工具调用与工作流编排，支撑数字分身与商业化项目稳定落地。</p>
            <div className="mt-5 flex flex-1 items-stretch gap-8">
              <div className="rz-panel flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px]" style={{ color: 'var(--rz-t-muted)' }}>AI 辅助研发提效</span>
                    <span className="font-mono text-lg font-semibold text-white"><b className="text-sm font-medium" style={{ color: 'var(--rz-orange)' }}>↑ 60%+</b> 迭代周期缩短</span>
                  </div>
                  <svg viewBox="0 0 520 130" className="my-2 h-[110px] w-full" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="rz-af" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#FF9E2F" stopOpacity=".32" />
                        <stop offset="1" stopColor="#FF9E2F" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <g stroke="rgba(255,255,255,.08)" strokeDasharray="4 6">
                      <line x1="0" y1="32" x2="520" y2="32" /><line x1="0" y1="64" x2="520" y2="64" /><line x1="0" y1="96" x2="520" y2="96" />
                    </g>
                    <line x1="0" y1="70" x2="520" y2="70" stroke="rgba(255,190,100,.22)" strokeDasharray="2 7" />
                    <path d="M0,102 C 12,102 18,94 30,94 C 36,94 40,99 46,99 C 53,99 57,80 64,80 C 75,80 81,86 92,86 C 102,86 108,64 118,64 C 127,64 131,70 140,70 C 151,70 157,52 168,52 C 179,52 185,60 196,60 C 207,60 213,44 224,44 C 234,44 240,66 250,66 C 261,66 267,50 278,50 C 289,50 295,58 306,58 C 316,58 322,38 332,38 C 344,38 350,46 362,46 C 373,46 379,28 390,28 C 401,28 407,36 418,36 C 429,36 435,20 446,20 C 458,20 464,26 476,26 C 486,26 492,14 502,14 C 509,14 513,18 520,18 L520,130 0,130 Z" fill="url(#rz-af)" />
                    <path d="M0,102 C 12,102 18,94 30,94 C 36,94 40,99 46,99 C 53,99 57,80 64,80 C 75,80 81,86 92,86 C 102,86 108,64 118,64 C 127,64 131,70 140,70 C 151,70 157,52 168,52 C 179,52 185,60 196,60 C 207,60 213,44 224,44 C 234,44 240,66 250,66 C 261,66 267,50 278,50 C 289,50 295,58 306,58 C 316,58 322,38 332,38 C 344,38 350,46 362,46 C 373,46 379,28 390,28 C 401,28 407,36 418,36 C 429,36 435,20 446,20 C 458,20 464,26 476,26 C 486,26 492,14 502,14 C 509,14 513,18 520,18" fill="none" stroke="#FFB056" strokeWidth="3" strokeLinecap="round" className="rz-bloom" />
                    <g fill="#FFC46B" opacity=".85"><circle cx="30" cy="94" r="2.4" /><circle cx="64" cy="80" r="2.4" /><circle cx="118" cy="64" r="2.4" /><circle cx="168" cy="52" r="2.4" /><circle cx="224" cy="44" r="2.4" /><circle cx="278" cy="50" r="2.4" /><circle cx="362" cy="46" r="2.4" /><circle cx="418" cy="36" r="2.4" /><circle cx="476" cy="26" r="2.4" /><circle cx="502" cy="14" r="2.4" /></g>
                      <circle cx="332" cy="38" r="6" fill="#FFD79A" className="rz-bloom" />
                      <circle cx="332" cy="38" r="11" fill="none" stroke="rgba(255,190,100,.5)" strokeWidth="1" />
                      <circle cx="520" cy="18" r="4.5" fill="#FFD79A" className="rz-bloom" /><circle cx="520" cy="18" r="9" fill="none" stroke="rgba(255,190,100,.4)" strokeWidth="1" />
                  </svg>
                  <div className="flex justify-between font-mono text-[10.5px]" style={{ color: 'var(--rz-t-muted)' }}>
                    <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
                  </div>
                </div>
              <div className="rz-panel hidden w-[170px] flex-none flex-col items-center justify-center gap-4 !rounded-xl md:flex">
                <div className="relative h-[112px] w-[112px]">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r="51" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
                    <defs><linearGradient id="rz-dz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFC46B" /><stop offset="1" stopColor="#F08312" /></linearGradient></defs>
                    <circle cx="60" cy="60" r="51" fill="none" stroke="url(#rz-dz)" strokeWidth="10" strokeLinecap="round" strokeDasharray="315" strokeDashoffset="12.6" className="rz-bloom" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[12px]" style={{ color: 'var(--rz-t-muted)' }}>常驻调度</span>
                    <span className="font-mono text-2xl font-bold" style={{ color: '#FFAB52' }}>7×24h</span>
                  </div>
                </div>
                <p className="text-center text-[12px] leading-relaxed" style={{ color: 'var(--rz-t-muted)' }}>多智能体<br />常驻编排</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2.5"><span className="rz-tag">LLM</span><span className="rz-tag">Agent</span><span className="rz-tag">工具调用</span><span className="rz-tag">监控</span><a href="#" className="rz-link ml-auto">查看详情 <span>→</span></a></div>
            </section>

            {/* 卡2 PB 级数据底座：左数据 + 右 mesh 拓扑 */}
            <section className="rz-card flex flex-col lg:h-[436px]" data-beam="data">
              <svg className="pointer-events-none absolute bottom-0 left-0 w-[200px]" viewBox="0 0 220 140" fill="none" aria-hidden="true" style={{ opacity: 0.4 }}>
              <g stroke="rgba(255,160,45,.4)" strokeWidth="1">
                <path d="M0 112 H70 L92 90 H124" /><path d="M0 88 H50 L72 66" /><path d="M24 140 V118 L46 96" />
              </g>
              <g fill="rgba(255,170,60,.55)">
                <circle cx="124" cy="90" r="2" /><circle cx="72" cy="66" r="2" /><circle cx="46" cy="96" r="2" />
              </g>
            </svg><div className="flex items-center justify-between gap-6">
<h3 className="text-2xl font-bold" style={{ textShadow: '0 0 18px rgba(255,255,255,.15)' }}>PB 级数据底座</h3>
                  <span className="rz-chip"><Database className="h-[34px] w-[34px]" style={{ color: 'var(--rz-orange)' }} strokeWidth={1.6} /></span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--rz-t-body)' }}>构建湖仓一体的数据平台，支撑海量数据存储、实时计算与多维分析，服务业务全链路。</p>
              <div className="mt-4 flex min-h-0 flex-1 gap-4">
                <div className="flex w-[210px] flex-none flex-col gap-4">
                  <div className="rz-panel flex flex-1 flex-col justify-center gap-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px]" style={{ color: 'var(--rz-t-muted)' }}>核心查询 P99 延迟</span>
                      <span className="font-mono text-[22px] font-bold leading-none">↓ 9×</span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <b className="pb-0.5 text-[11px] font-medium leading-none" style={{ color: 'var(--rz-orange)' }}>百亿级数据</b>
                      <svg viewBox="0 0 110 30" className="h-6 w-[96px] flex-none" preserveAspectRatio="none" aria-hidden="true">
                        <defs>
                          <linearGradient id="rz-af2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#FF9E2F" stopOpacity=".4" />
                            <stop offset="1" stopColor="#FF9E2F" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,6 14,10 28,8 44,14 60,12 76,18 92,16 110,24 L110,30 0,30 Z" fill="url(#rz-af2)" />
                        <path d="M0,6 14,10 28,8 44,14 60,12 76,18 92,16 110,24" fill="none" stroke="#FFB056" strokeWidth="1.8" strokeLinecap="round" className="rz-bloom" />
                        <circle cx="110" cy="24" r="2.4" fill="#FFD79A" className="rz-bloom" />
                      </svg>
                    </div>
                  </div>
                  <div className="rz-panel flex flex-1 flex-col justify-center gap-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px]" style={{ color: 'var(--rz-t-muted)' }}>数据体量</span>
                      <span className="font-mono text-[22px] font-bold leading-none">PB 级</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-[13px]" style={{ color: 'var(--rz-t-body)' }}>
                      <span className="rz-pulse h-1.5 w-1.5 rounded-full" style={{ background: 'var(--rz-green)', boxShadow: '0 0 8px var(--rz-green)' }} />
                      <span>百亿级行 · 实时离线一体</span>
                    </div>
                  </div>
                </div>
                <div className="rz-panel relative flex-1 overflow-hidden">
                  <div className="absolute left-4 top-3 z-10 flex items-baseline gap-2">
                    <span className="text-[12px] font-medium" style={{ color: '#D9A05B' }}>数据血缘</span>
                    <span className="font-mono text-[10px] tracking-[.18em]" style={{ color: 'var(--rz-t-muted)' }}>DATA LINEAGE</span>
                  </div>
                  <svg viewBox="0 0 640 200" className="h-full w-full pt-4" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                    <g fill="none" stroke="rgba(255,158,47,.45)" strokeWidth="1.2">
                      {LINEAGE.edges.map((e, i) => (
                        <path key={i} d={e.d} className={('flow' in e) ? 'rz-flow' : undefined} />
                      ))}
                    </g>
                    {LINEAGE.nodes.map((n) => (
                      <g key={n.label}>
                        <rect
                          x={n.cx - ((n as { w?: number }).w ?? 68) / 2}
                          y={n.cy - 12}
                          width={(n as { w?: number }).w ?? 68}
                          height={24}
                          rx={12}
                          fill={n.tier === 'core' ? 'rgba(255,158,46,.12)' : '#1d1409'}
                          stroke={n.tier === 'core' ? 'rgba(255,183,94,.9)' : 'rgba(255,158,47,.4)'}
                          strokeWidth={n.tier === 'core' ? 1.5 : 1}
                          style={n.tier === 'core' ? { filter: 'drop-shadow(0 0 6px rgba(255,170,60,.5))' } : undefined}
                        />
                        <text
                          x={n.cx}
                          y={n.cy + 4}
                          textAnchor="middle"
                          fontSize={11}
                          fill={n.tier === 'core' ? '#FFD79A' : '#CDB08A'}
                          style={{ fontWeight: n.tier === 'core' ? 600 : 400 }}
                        >
                          {n.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="rz-tag">数据湖</span><span className="rz-tag">Flink</span><span className="rz-tag">Spark</span><span className="rz-tag">数仓</span>
                <a href="#" className="rz-link ml-auto">查看详情 <span>→</span></a>
              </div>
            </section>

            {/* 卡3 政企大客户交付 */}
            <section className="rz-card flex flex-col lg:h-[436px]" data-beam="gov">
              <svg className="pointer-events-none absolute bottom-0 left-0 w-[200px]" viewBox="0 0 220 140" fill="none" aria-hidden="true" style={{ opacity: 0.4 }}>
              <g stroke="rgba(255,160,45,.4)" strokeWidth="1">
                <path d="M0 112 H70 L92 90 H124" /><path d="M0 88 H50 L72 66" /><path d="M24 140 V118 L46 96" />
              </g>
              <g fill="rgba(255,170,60,.55)">
                <circle cx="124" cy="90" r="2" /><circle cx="72" cy="66" r="2" /><circle cx="46" cy="96" r="2" />
              </g>
            </svg><div className="flex items-center justify-between gap-6">
<h3 className="text-2xl font-bold" style={{ textShadow: '0 0 18px rgba(255,255,255,.15)' }}>政企大客户交付</h3>
                  <span className="rz-chip"><Landmark className="h-[34px] w-[34px]" style={{ color: 'var(--rz-orange)' }} strokeWidth={1.6} /></span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--rz-t-body)' }}>面向政府与大型企业客户，涵盖数据中台、AI 应用、可视化大屏的全周期交付。</p>
              <div className="mt-5 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rz-panel flex items-center gap-4">
                  <div className="relative h-[68px] w-[68px] flex-none">
                    <svg viewBox="0 0 70 70" className="h-full w-full -rotate-90" aria-hidden="true">
                      <defs>
                        <linearGradient id="rz-dg2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor="#FFC46B" />
                          <stop offset="1" stopColor="#F08312" />
                        </linearGradient>
                      </defs>
                      <circle cx="35" cy="35" r="29" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
                      <circle cx="35" cy="35" r="29" fill="none" stroke="url(#rz-dg2)" strokeWidth="7" strokeLinecap="round" strokeDasharray="172" strokeDashoffset="45.5" className="rz-bloom" />
                      <circle cx="35" cy="64" r="3" fill="#FFD79A" className="rz-bloom" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold">4 城</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] tracking-[.16em]" style={{ color: '#6E5B48' }}>CITIES</p>
                    <p className="mt-0.5 text-[13px]" style={{ color: 'var(--rz-t-muted)' }}>城市大脑交付</p>
                    <p className="mt-1 text-[14px] font-bold">专有云项目交付</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: 'var(--rz-t-muted)' }}>政府 · 央企客户</p>
                  </div>
                </div>
                <div className="rz-panel flex flex-col justify-between">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px]" style={{ color: 'var(--rz-t-muted)' }}>交付提效</span>
                    <span className="font-mono text-[9px] tracking-[.16em]" style={{ color: '#6E5B48' }}>EFFICIENCY</span>
                  </div>
                  <svg viewBox="0 0 200 60" className="my-1 h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="rz-af3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#FF9E2F" stopOpacity=".3" />
                        <stop offset="1" stopColor="#FF9E2F" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,52 34,46 62,49 96,38 130,41 166,26 200,10 L200,60 0,60 Z" fill="url(#rz-af3)" />
                    <path d="M0,52 C 12,52 22,46 34,46 C 46,46 50,49 62,49 C 75,49 83,38 96,38 C 109,38 116,41 130,41 C 143,41 152,26 166,26 C 178,26 188,10 200,10" fill="none" stroke="#FFB056" strokeWidth="2.6" strokeLinecap="round" className="rz-bloom" />
                    <g fill="#FFC46B"><circle cx="34" cy="46" r="2.2" /><circle cx="96" cy="38" r="2.2" /><circle cx="166" cy="26" r="2.2" /></g>
                    <circle cx="200" cy="10" r="3.6" fill="#FFD79A" className="rz-bloom" />
                    <circle cx="200" cy="10" r="7.5" fill="none" stroke="rgba(255,190,100,.4)" strokeWidth="1" />
                  </svg>
                  <div className="flex justify-between font-mono text-[9.5px]" style={{ color: 'var(--rz-t-muted)' }}>
                    <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
                  </div>
                  <div className="mt-1 font-mono text-sm"><b className="font-semibold" style={{ color: 'var(--rz-orange)' }}>↑ 60%+</b> <span className="ml-1 text-[12px]" style={{ color: 'var(--rz-t-muted)' }}>迭代周期缩短</span></div>
                </div>
                <div className="rz-panel flex items-center gap-4">
                  <div className="relative h-[72px] w-[72px] flex-none">
                    <svg viewBox="0 0 72 72" className="h-full w-full" aria-hidden="true">
                      {TICKS.map((t, i) => (
                        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.lit ? '#FFAB52' : 'rgba(255,158,47,.22)'} strokeWidth="2.2" strokeLinecap="round" style={t.lit ? { filter: 'drop-shadow(0 0 4px rgba(255,170,70,.85))' } : undefined} />
                      ))}
                    </svg>
                    <span className="rz-glow absolute inset-0 flex items-baseline justify-center pt-[22px] font-mono text-lg font-bold">7<span className="ml-0.5 text-[10px] font-medium" style={{ color: 'var(--rz-t-muted)' }}>年</span></span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] tracking-[.16em]" style={{ color: '#6E5B48' }}>EXPERIENCE</p>
                    <p className="mt-0.5 text-[13px]" style={{ color: 'var(--rz-t-muted)' }}>全链路经验</p>
                    <p className="mt-1 text-[14px] font-bold">数据与 AI 工程</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: 'var(--rz-t-muted)' }}>交通 → 云 → 电商 → AI</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="rz-tag">数据中台</span><span className="rz-tag">行业方案</span><span className="rz-tag">AI 应用</span><span className="rz-tag">咨询服务</span>
                <a href="#" className="rz-link ml-auto">查看详情 <span>→</span></a>
              </div>
            </section>
          </div>

          {/* 右列：时间线 + 引言 */}
          <div className="flex flex-col gap-6">
            <section className="rz-card rz-card-bright flex flex-1 flex-col" data-beam="timeline">
              <svg className="pointer-events-none absolute right-0 top-0 w-[150px]" viewBox="0 0 150 60" fill="none" aria-hidden="true" style={{ opacity: 0.35 }}>
                <g stroke="rgba(255,160,45,.5)" strokeWidth="1">
                  <path d="M150 14 H96 L82 28 H40" /><path d="M150 34 H110 L96 48 H64" />
                </g>
                <g fill="rgba(255,170,60,.6)">
                  <circle cx="40" cy="28" r="2" /><circle cx="64" cy="48" r="2" />
                </g>
              </svg>
            <span className="rz-pin rz-pin-l" style={{ top: '24%' }} /><span className="rz-pin rz-pin-l" style={{ top: '27%' }} /><span className="rz-pin rz-pin-r" style={{ top: '56%' }} /><span className="rz-pin rz-pin-r" style={{ top: '59%' }} />
              <div className="-m-[1px] flex items-center gap-0">
                <span className="px-5 py-2.5 font-mono text-[13px] tracking-widest" style={{ color: 'var(--rz-orange-hi)', border: '1px solid rgba(255,183,94,.8)', borderBottomColor: '#1a1208', background: 'linear-gradient(180deg,rgba(255,158,46,.16),#1a1208)', boxShadow: '0 -4px 14px rgba(255,150,40,.15)', clipPath: 'polygon(0 0,100% 0,calc(100% - 12px) 100%,0 100%)' }}>我的成长轨迹</span>
              </div>
              <div className="relative mt-8 flex flex-1 flex-col justify-between gap-6 pb-3 pl-8">
                <span className="absolute bottom-8 left-[9px] top-2 w-[2px]" style={{ background: 'linear-gradient(180deg,#FFC46B,#FF9E2F 55%,rgba(255,158,47,0))', boxShadow: '0 0 8px rgba(255,158,47,.55)' }} />
                {TIMELINE.map((item) => (
                  <div key={item.year} className="relative">
                    <span className={item.current ? 'rz-node rz-node-current' : 'rz-node'} aria-hidden="true" />
                    <p className="flex items-center">
                      <span className="rz-year-grad font-mono text-[38px] font-bold leading-none">{item.year}</span>
                      {item.current && <span className="rz-now">进行中</span>}
                    </p>
                    <p className="mt-1.5 text-[16px] font-bold">{item.title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--rz-t-body)' }}>{item.desc}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {item.tags.map((t) => (
                        <span key={t} className="rz-tl-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rz-card">
              <span className="block text-5xl font-black leading-none" style={{ color: 'var(--rz-orange)' }}>&ldquo;</span>
              <p className="mt-1 text-[17px] leading-[1.9]">数据让世界更透明，AI 让创造力更自由。我希望用技术和内容，帮助更多人看见更大的世界。</p>
              <p className="mt-4 text-right text-[14px]" style={{ color: 'var(--rz-t-muted)' }}>—— 李自在</p>
            </section>
          </div>
        </main>

        {/* CTA：标题左 + 按钮右 */}
        <footer id="contact" className="rz-card rz-hud relative mt-11 flex min-h-[240px] items-center justify-between gap-8 overflow-hidden" style={{ padding: '32px 44px' }}>
          <Image
            src="/resume/globe.webp"
            alt=""
            width={1200}
            height={1200}
            sizes="(max-width: 768px) 0px, 500px"
            className="absolute -left-[10%] top-1/2 w-[34%] max-w-none -translate-y-1/2"
            style={{ mixBlendMode: 'screen', opacity: 0.72, filter: 'brightness(.72) saturate(.95)' }}
          />
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 150% at 82% 20%, rgba(8,6,4,.7) 45%, transparent 75%)' }} />
          <div className="relative z-10 ml-[8%] min-w-0 flex-1" style={{ background: 'linear-gradient(90deg, rgba(8,6,4,0) 0, rgba(8,6,4,.88) 14%)' }}>
            <h2 className="text-[clamp(44px,4vw,58px)] font-black leading-none tracking-[-0.01em]">来聊聊<span style={{ color: 'var(--rz-orange)', marginLeft: '-0.06em' }}>.</span></h2>
            <p className="mt-4 text-[16px]" style={{ color: '#D8D8D8', opacity: 0.85 }}>无论是合作、交流，还是技术问题，我都很乐意和你聊聊。</p>
          </div>
          <div className="relative z-10 flex flex-none flex-col gap-4 sm:flex-row">
            <a href="mailto:hello@example.com" className="rz-btn-main">联系我 <span>→</span></a>
            <a href="#" className="rz-btn-ghost">订阅博客</a>
          </div>
        </footer>

        {/* 页脚 */}
        <div className="mt-2 flex h-16 items-center justify-between font-mono text-[12px] tracking-[.18em]" style={{ color: '#C4C4C4' }}>
          <span>DATA <b className="font-medium not-italic text-[var(--rz-orange)]">×</b> AI <b className="font-medium not-italic text-[var(--rz-orange)]">×</b> CONTENT <b className="font-medium not-italic text-[var(--rz-orange)]">×</b> GROWTH</span>
          <span>李自在 / 2026 · CHINA</span>
        </div>
      </div>
    </div>
  );
}
