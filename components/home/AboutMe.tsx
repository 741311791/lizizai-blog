'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import SocialLinks from '@/components/ui/social-links';

export default function AboutMe() {
  const t = useTranslations('home');

  return (
    <section className="relative pt-8 pb-16 lg:pt-12 lg:pb-20">

      {/* 主布局：左栏头像+社交 | 右栏文字 */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-16 items-start">
        {/* 左栏：头像 + 社交图标 */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-52 h-52 lg:w-[280px] lg:h-[280px] rounded-full overflow-hidden border-2 border-border">
            <Image
              src="/avator/avatar_smile.png"
              alt="Zizai Li"
              fill
              className="object-cover"
              priority
            />
          </div>
          <SocialLinks iconSize={24} className="gap-5" />
        </div>

        {/* 右栏：个人介绍 */}
        <div className="space-y-5">
          {/* 名字标题 */}
          <h2 className="font-[family-name:var(--font-noto-serif-sc)] text-[36px] font-black leading-[1.3] tracking-tight">
            {t('greeting')}
          </h2>

          {/* 身份标签 */}
          <p className="text-sm tracking-wider text-muted-foreground">
            {t('aboutSubtitle')}
          </p>

          {/* 核心理念引述块 */}
          <blockquote className="border-l-[3px] border-primary pl-4">
            <p className="text-[17px] leading-[1.8] text-foreground/85">
              {t('bioParagraph1')}
            </p>
          </blockquote>

          {/* 正文段落 */}
          <p className="text-[17px] leading-[1.8] text-foreground/80">
            {t('bioParagraph2')}
          </p>

          {/* 写作方向标签 */}
          <div className="flex flex-wrap gap-2 pt-1">
            {t('aboutDirections').split('·').map((dir) => (
              <span
                key={dir.trim()}
                className="inline-block rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary"
              >
                {dir.trim()}
              </span>
            ))}
          </div>

          {/* 收尾金句 */}
          <p className="text-[17px] leading-[1.8] font-medium text-foreground/90 pt-2">
            {t('bioParagraph3')}
          </p>
        </div>
      </div>
    </section>
  );
}
