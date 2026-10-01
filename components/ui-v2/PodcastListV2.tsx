'use client';

/**
 * PodcastListV2 — 播客视图（编辑风升级版，预览组件）
 * 专辑头卡（大封面 + PODCAST 金标 + 衬线标题 + 集数）+ 多集 hairline 剧集行列表；
 * 封面兜底链：集封面 → 文章封面 → 编辑风声波占位；单集直接展开播放区
 * 播放器/文字稿逻辑同 PodcastList（选择切换、文字稿懒加载、请求序号防过期）
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Play, FileText, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import type { PodcastItem } from '@/types/index';

// react-markdown/hljs/mermaid 仅在文字稿展开时加载
const MarkdownContent = dynamic(() => import('@/components/article/MarkdownContent'), {
  ssr: false,
  loading: () => <div className="h-24 rounded-lg bg-muted animate-pulse" />,
});

const AudioPlayer = dynamic(() => import('@/components/article/AudioPlayer'), {
  loading: () => <div className="h-20 rounded-lg bg-muted animate-pulse" />,
});

/** 声波竖条高度（视觉上像一段音频波形） */
const WAVE_BARS = [10, 22, 14, 30, 18, 26, 12, 20];

/** 编辑风声波占位封面：暖光渐变 + 金色波形 + PODCAST mono 角标 */
function CoverFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-card">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120px 80px at 50% 20%, rgba(217,119,6,.16), transparent 70%)',
        }}
      />
      <svg width="64" height="40" viewBox="0 0 64 40" fill="none" className="relative" aria-hidden="true">
        {WAVE_BARS.map((h, i) => (
          <rect
            key={i}
            x={4 + i * 8}
            y={20 - h / 2}
            width="3"
            height={h}
            rx="1.5"
            fill="rgba(217,119,6,.75)"
          />
        ))}
      </svg>
      <span className="absolute bottom-1.5 left-2 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/80">
        Podcast
      </span>
    </div>
  );
}

/** 封面渲染：有图用图，无图落声波占位 */
function PodcastCover({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <CoverFallback />;
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
    />
  );
}

interface PodcastListV2Props {
  podcasts: PodcastItem[];
  articleTitle: string;
  /** 文章封面（集封面缺失时的兜底） */
  articleCover?: string;
}

export default function PodcastListV2({
  podcasts,
  articleTitle,
  articleCover,
}: PodcastListV2Props) {
  const t = useTranslations('article');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState('');
  // 请求序号：快速切换播客时丢弃过期的文字稿响应
  const transcriptReqRef = useRef(0);

  // 单集时无需选择，直接展开唯一一集
  const isSingle = podcasts.length === 1;
  const activePodcast = isSingle
    ? podcasts[0]
    : podcasts.find((p) => p.slug === activeSlug);

  // 加载文字稿
  const handleToggleTranscript = useCallback(async () => {
    if (showTranscript) {
      setShowTranscript(false);
      return;
    }
    if (transcriptContent) {
      setShowTranscript(true);
      return;
    }
    if (!activePodcast?.scriptFile) return;
    const requestId = ++transcriptReqRef.current;
    try {
      const res = await fetch(activePodcast.scriptFile);
      if (!res.ok) return;
      const text = await res.text();
      if (transcriptReqRef.current !== requestId) return;
      setTranscriptContent(text);
      setShowTranscript(true);
    } catch {
      // 加载失败静默处理
    }
  }, [showTranscript, transcriptContent, activePodcast]);

  const handleSelectPodcast = useCallback((slug: string) => {
    transcriptReqRef.current++; // 使旧请求过期
    setActiveSlug(prev => (prev === slug ? null : slug));
    setShowTranscript(false);
    setTranscriptContent('');
  }, []);

  if (podcasts.length === 0) return null;

  return (
    <div className="mb-8 space-y-6">
      {/* 专辑头卡：大封面 + PODCAST 金标 + 衬线标题 + 集数 */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(360px 120px at 15% -20%, rgba(217,119,6,.09), transparent 70%)',
          }}
        />
        <div className="relative flex items-center gap-5">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-white/10 sm:h-32 sm:w-32">
            <PodcastCover
              src={podcasts[0]?.coverFile || articleCover}
              alt={articleTitle}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-primary">
              Podcast
            </p>
            <h3 className="mt-2 font-serif text-xl font-bold leading-snug tracking-tight sm:text-2xl">
              {articleTitle}
            </h3>
            <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {podcasts.length} {podcasts.length > 1 ? 'Episodes' : 'Episode'}
            </p>
          </div>
        </div>
      </div>

      {/* 剧集列表（多集时）：mono 序号 + hairline 行 + 选中金 rule */}
      {!isSingle && (
        <div>
          {podcasts.map((podcast, i) => {
            const active = activeSlug === podcast.slug;
            return (
              <button
                key={podcast.slug}
                onClick={() => handleSelectPodcast(podcast.slug)}
                className={cn(
                  'group relative flex w-full items-center gap-4 border-b border-border/60 px-2 py-3.5 text-left transition-colors first:border-t first:border-border/60',
                  active ? 'bg-muted/40' : 'hover:bg-muted/30'
                )}
              >
                {/* 左侧游标线：hover 半透明浮现 / 选中常驻 */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-primary transition-opacity duration-200',
                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  )}
                />
                {/* 状态格三态：序号 ↔ hover 金 Play（crossfade）↔ 播放中声波律动 */}
                <span className="relative flex h-5 w-6 shrink-0 items-center justify-center">
                  {active ? (
                    <span className="flex items-end gap-[2px]" aria-hidden="true">
                      <span
                        className="w-[2px] bg-primary"
                        style={{ animation: 'rz-eq .9s ease-in-out infinite', height: 6 }}
                      />
                      <span
                        className="w-[2px] bg-primary"
                        style={{ animation: 'rz-eq .9s ease-in-out infinite .15s', height: 6 }}
                      />
                      <span
                        className="w-[2px] bg-primary"
                        style={{ animation: 'rz-eq .9s ease-in-out infinite .3s', height: 6 }}
                      />
                    </span>
                  ) : (
                    <>
                      <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-muted-foreground/50 transition-all duration-200 group-hover:-translate-y-1 group-hover:opacity-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <Play
                        className="absolute ml-0.5 h-3 w-3 translate-y-1 text-primary opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm transition-colors',
                    active ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {podcast.name}
                </span>
                {podcast.audioSize && (
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/70">
                    {(podcast.audioSize / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 播放区：选中集（多集）或唯一集（单集） */}
      {activePodcast && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h4 className="text-sm font-semibold">{activePodcast.name}</h4>

          <AudioPlayer
            audioUrl={activePodcast.audioFile}
            title={activePodcast.name}
          />

          {/* 文字稿切换按钮 */}
          {activePodcast.scriptFile && (
            <div>
              <button
                onClick={handleToggleTranscript}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                {t('transcript')}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${showTranscript ? 'rotate-180' : ''}`}
                />
              </button>
              {showTranscript && transcriptContent && (
                <div className="mt-4 border-t border-border pt-4">
                  <MarkdownContent content={transcriptContent} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
