'use client';

import { Mic, Presentation } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ContentComingSoonProps {
  type: 'podcast' | 'slides';
}

/**
 * 播客/幻灯片内容类型兜底页
 * 功能开发中，显示"即将上线"占位
 */
export default function ContentComingSoon({ type }: ContentComingSoonProps) {
  const t = useTranslations('article');

  const config = {
    podcast: {
      Icon: Mic,
      title: t('podcastComingSoonTitle'),
      desc: t('podcastComingSoonDesc'),
    },
    slides: {
      Icon: Presentation,
      title: t('slidesComingSoonTitle'),
      desc: t('slidesComingSoonDesc'),
    },
  };

  const { Icon, title, desc } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
        <Icon className="size-7 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
