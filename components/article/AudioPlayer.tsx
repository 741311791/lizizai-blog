'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { formatTime } from '@/lib/utils/format';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  title?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onChapterChange?: (chapterIndex: number) => void;
  chapters?: { id: string; title: string; startTime: number }[];
}

/**
 * 粘性音频播放器
 * 原生 <audio> 元素（preload=metadata，未播放不拉音频流），支持播放/暂停、进度拖拽、倍速、章节跳转。
 * 播放态由原生 play/pause 事件反向同步，自动播放策略拒绝时不会失同步。
 */
export default function AudioPlayer({
  audioUrl,
  duration,
  title,
  onTimeUpdate,
  onChapterChange,
  chapters,
}: AudioPlayerProps) {
  const t = useTranslations('article');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // 上报节流：外层回调仅整秒变化时触发（避免 ~4Hz 逐级 setState 重渲整棵树）
  const lastSecondRef = useRef(-1);
  const lastChapterRef = useRef(-1);

  // 检测当前章节
  const getCurrentChapterIndex = useCallback((time: number) => {
    if (!chapters || chapters.length === 0) return -1;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (time >= chapters[i].startTime) return i;
    }
    return -1;
  }, [chapters]);

  // 播放/暂停：play() 结果由原生事件反向同步，拒绝时回退按钮态
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  // 进度跳转（点击/键盘共用）
  const seekToRatio = useCallback((ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    audio.currentTime = clamped * audio.duration;
    setCurrentTime(audio.currentTime);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    seekToRatio((e.clientX - rect.left) / rect.width);
  }, [seekToRatio]);

  // slider 键盘左右步进 ±5s
  const handleProgressKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      setCurrentTime(audio.currentTime);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
      setCurrentTime(audio.currentTime);
    }
  }, []);

  // 倍速切换
  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIdx = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  }, [playbackRate]);

  // 章节跳转
  const seekToChapter = useCallback((startTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = startTime;
    setCurrentTime(startTime);
    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, []);

  // timeupdate（本地 UI 更新每帧，外层回调按秒节流；章节变化仅在实际变化时上报）
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = audio.currentTime;
    setCurrentTime(time);

    const second = Math.floor(time);
    if (second !== lastSecondRef.current) {
      lastSecondRef.current = second;
      onTimeUpdate?.(time);
    }

    if (chapters && onChapterChange) {
      const chapterIdx = getCurrentChapterIndex(time);
      if (chapterIdx >= 0 && chapterIdx !== lastChapterRef.current) {
        lastChapterRef.current = chapterIdx;
        onChapterChange(chapterIdx);
      }
    }
  }, [chapters, getCurrentChapterIndex, onChapterChange, onTimeUpdate]);

  // 监听外部 seek 事件（来自侧边栏章节点击）
  useEffect(() => {
    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      const startTime = customEvent.detail;
      const audio = audioRef.current;
      if (audio && typeof startTime === 'number') {
        audio.currentTime = startTime;
        setCurrentTime(startTime);
        if (audio.paused) {
          audio.play().catch(() => setIsPlaying(false));
        }
      }
    };
    window.addEventListener('podcast-seek', handleSeek);
    return () => window.removeEventListener('podcast-seek', handleSeek);
  }, []);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="sticky top-2 z-40 rounded-lg border border-border bg-card/95 backdrop-blur-sm p-4 mb-8">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setTotalDuration(e.currentTarget.duration);
          setIsLoading(false);
        }}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsLoading(false)}
      />

      <div className="flex items-center gap-3">
        {/* 播放/暂停按钮 */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-[background-color,transform] active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100"
          aria-label={isPlaying ? t('pause') : t('play')}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* 进度条 — py 扩命中区 + slider ARIA 与键盘步进 */}
        <div className="flex-1 min-w-0">
          <div
            ref={progressRef}
            role="slider"
            tabIndex={0}
            aria-label={t('progress')}
            aria-valuemin={0}
            aria-valuemax={Math.round(totalDuration)}
            aria-valuenow={Math.round(currentTime)}
            onClick={handleProgressClick}
            onKeyDown={handleProgressKey}
            className="w-full py-2.5 -my-1.5 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-full"
          >
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full group-hover:h-1.5"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* 倍速按钮 */}
        <button
          onClick={cycleSpeed}
          className="flex-shrink-0 px-3 py-2 bg-secondary border border-border rounded text-secondary-foreground text-xs hover:bg-accent transition-[background-color,transform] active:scale-[0.96]"
        >
          {t('speed', { rate: playbackRate })}
        </button>
      </div>

      {/* 章节快捷跳转（可选） */}
      {chapters && chapters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => seekToChapter(ch.startTime)}
              className="px-2.5 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors active:scale-[0.96]"
            >
              {formatTime(ch.startTime)} {ch.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
