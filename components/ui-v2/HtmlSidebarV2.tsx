
/**
 * HtmlSidebarV2 — HTML 内容类型侧栏（预览组件）
 * TOC 位置换为阅读指南卡：HTML 目录由 iframe 内文档自带（sandbox 禁止跨 frame 操作），
 * 父页锚点无法跳转，指南卡引导用户使用内置目录与全屏模式；下方保留阅读数据与标签
 */

import { useTranslations } from 'next-intl';
import { List, Maximize2, MoveVertical } from 'lucide-react';
import type { Article } from '@/types/index';
import SidebarStats from '@/components/article/SidebarStats';
import SidebarSectionTitle from '@/components/article/SidebarSectionTitle';

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
        <SidebarSectionTitle eyebrow="Guide" title={t('guideTitle')} />
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

      {/* 阅读数据 + 标签（HTML 类型无对应 RSS feed，隐藏订阅区块） */}
      <SidebarStats article={article} showFeeds={false} />
    </div>
  );
}
