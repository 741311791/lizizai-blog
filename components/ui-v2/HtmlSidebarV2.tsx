'use client';

/**
 * HtmlSidebarV2 — HTML 内容类型侧栏（预览组件）
 * TOC 位置换为阅读指南卡：HTML 目录由 iframe 内文档自带（sandbox 禁止跨 frame 操作），
 * 父页锚点无法跳转，指南卡引导用户使用内置目录与全屏模式；下方保留阅读数据与标签
 */

import { useTranslations } from 'next-intl';
import { List, Maximize2, MoveVertical } from 'lucide-react';
import type { Article } from '@/types/index';
import SidebarStats from '@/components/article/SidebarStats';

interface HtmlSidebarV2Props {
  article: Article;
}

export default function HtmlSidebarV2({ article }: HtmlSidebarV2Props) {
  const t = useTranslations('article');

  const guides = [
    { icon: List, title: t('guideToc'), desc: t('guideTocDesc') },
    { icon: Maximize2, title: t('guideFullscreen'), desc: t('guideFullscreenDesc') },
    { icon: MoveVertical, title: t('guideEmbed'), desc: t('guideEmbedDesc') },
  ];

  return (
    <div className="space-y-7">
      {/* 阅读指南（替代 TOC） */}
      <div>
        <div className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-primary">
          Guide
        </div>
        <div className="mt-1 text-sm font-bold">{t('guideTitle')}</div>
        <span
          className="mt-2.5 mb-3 block h-[2px] w-8 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, var(--color-primary), transparent)',
          }}
          aria-hidden="true"
        />
        <div>
          {guides.map((guide) => (
            <div
              key={guide.title}
              className="flex gap-3 border-b border-border/60 py-3 last:border-0"
            >
              <guide.icon
                className="mt-0.5 h-4 w-4 shrink-0 text-primary/80"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">{guide.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {guide.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 阅读数据 */}
      <SidebarStats article={article} />

      {/* 标签 */}
      {article.tags && article.tags.length > 0 && (
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('tagsLabel')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag.slug}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
