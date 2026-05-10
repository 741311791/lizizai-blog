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
 * 原生 HTMLAudioElement，支持播放/暂停、进度拖拽、倍速、章节跳转
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

  // 检测当前章节
  const getCurrentChapterIndex = useCallback((time: number) => {
    if (!chapters || chapters.length === 0) return -1;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (time >= chapters[i].startTime) return i;
    }
    return -1;
  }, [chapters]);

  // 播放/暂停
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // 进度点击跳转
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setCurrentTime(audio.currentTime);
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
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setTotalDuration(audio.duration);
      setIsLoading(false);
    });

    audio.addEventListener('timeupdate', () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);

      // 章节变化检测
      if (chapters && onChapterChange) {
        const chapterIdx = getCurrentChapterIndex(time);
        if (chapterIdx >= 0) {
          onChapterChange(chapterIdx);
        }
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('error', () => {
      setIsLoading(false);
    });

    // 监听外部 seek 事件（来自侧边栏章节点击）
    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      const startTime = customEvent.detail;
      if (typeof startTime === 'number') {
        audio.currentTime = startTime;
        setCurrentTime(startTime);
        if (audio.paused) {
          audio.play();
          setIsPlaying(true);
        }
      }
    };
    window.addEventListener('podcast-seek', handleSeek);

    return () => {
      window.removeEventListener('podcast-seek', handleSeek);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioUrl, chapters, getCurrentChapterIndex, onChapterChange, onTimeUpdate]);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="sticky top-2 z-40 rounded-lg border border-border bg-card/95 backdrop-blur-sm p-4 mb-8">
      <audio ref={audioRef} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* 播放/暂停按钮 */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
          aria-label={isPlaying ? t('pause') : t('play')}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* 进度条 */}
        <div className="flex-1 min-w-0">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="w-full h-1 bg-muted rounded-full overflow-hidden cursor-pointer group"
          >
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-100 group-hover:h-1.5"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* 倍速按钮 */}
        <button
          onClick={cycleSpeed}
          className="flex-shrink-0 px-2 py-1 bg-secondary border border-border rounded text-secondary-foreground text-xs hover:bg-accent transition-colors"
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
              className="px-2 py-0.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              {formatTime(ch.startTime)} {ch.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
