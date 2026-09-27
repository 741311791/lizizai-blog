'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Mic, Play, Pause, FileText, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { PodcastItem } from '@/types/index';

// react-markdown/hljs/mermaid 仅在文字稿展开时加载
const MarkdownContent = dynamic(() => import('./MarkdownContent'), {
  ssr: false,
  loading: () => <div className="h-24 rounded-lg bg-muted animate-pulse" />,
});

const AudioPlayer = dynamic(() => import('./AudioPlayer'), {
  loading: () => <div className="h-20 rounded-lg bg-muted animate-pulse mb-8" />,
});

interface PodcastListProps {
  podcasts: PodcastItem[];
  articleTitle: string;
}

/**
 * 播客列表组件
 * 展示多个播客卡片，每个包含封面、名称、播放器和文字稿
 */
export default function PodcastList({ podcasts, articleTitle }: PodcastListProps) {
  const t = useTranslations('article');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptContent, setTranscriptContent] = useState('');
  // 请求序号：快速切换播客时丢弃过期的文字稿响应
  const transcriptReqRef = useRef(0);

  const activePodcast = podcasts.find(p => p.slug === activeSlug);

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
    setActiveSlug(prev => prev === slug ? null : slug);
    setShowTranscript(false);
    setTranscriptContent('');
  }, []);

  if (podcasts.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* 播客卡片列表 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {podcasts.map(podcast => (
          <button
            key={podcast.slug}
            onClick={() => handleSelectPodcast(podcast.slug)}
            className={`group relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all text-left cursor-pointer ${
              activeSlug === podcast.slug
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-border bg-card hover:border-primary/30 hover:bg-accent/30'
            }`}
          >
            {/* 封面 */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
              {podcast.coverFile ? (
                <img
                  src={podcast.coverFile}
                  alt={podcast.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <Mic className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            {/* 名称 */}
            <div className="text-center min-w-0 w-full">
              <div className="text-sm font-semibold truncate">
                {podcast.name}
              </div>
              {podcast.audioSize && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {(podcast.audioSize / (1024 * 1024)).toFixed(1)} MB
                </div>
              )}
            </div>

            {/* 播放图标 */}
            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
              {activeSlug === podcast.slug ? (
                <Pause className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Play className="w-3.5 h-3.5 text-primary ml-0.5" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 选中播客的播放器 + 文字稿 */}
      {activePodcast && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{activePodcast.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{articleTitle}</p>
            </div>
          </div>

          <AudioPlayer
            audioUrl={activePodcast.audioFile}
            title={activePodcast.name}
          />

          {/* 文字稿切换按钮 */}
          {activePodcast.scriptFile && (
            <div>
              <button
                onClick={handleToggleTranscript}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                {t('transcript')}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTranscript ? 'rotate-180' : ''}`} />
              </button>
              {showTranscript && transcriptContent && (
                <div className="mt-4 pt-4 border-t border-border">
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
