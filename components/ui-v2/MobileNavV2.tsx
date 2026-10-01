'use client';

/**
 * MobileNavV2 — 移动端导航抽屉（编辑风升级版，预览组件）
 * 衬线品牌区 + mono 序号导航列表（hairline 分隔）+ 激活态金色左 rule + 底部订阅/语言区
 * 导航数据与激活逻辑同 MobileNav，仅视觉升级
 */

import { Link, usePathname } from '@/i18n/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

const NAV_LINKS: {
  href: string;
  labelKey:
    | 'home'
    | 'aiNews'
    | 'ai'
    | 'cognition'
    | 'premiumCourse'
    | 'portfolio'
    | 'archive'
    | 'resume';
  accent?: boolean;
}[] = [
  { href: '/', labelKey: 'home' },
  { href: '/daily-news', labelKey: 'aiNews' },
  { href: '/category/ai', labelKey: 'ai' },
  { href: '/category/human-3-0', labelKey: 'cognition' },
  { href: '/category/premium-course', labelKey: 'premiumCourse' },
  { href: '/category/portfolio', labelKey: 'portfolio' },
  { href: '/archive', labelKey: 'archive' },
  { href: '/resume', labelKey: 'resume', accent: true },
];

export default function MobileNavV2() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 xl:hidden"
          aria-label={t('menu')}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-[86vw] max-w-sm flex-col gap-0 p-0">
        {/* 品牌区：暖光点缀 + mono 小标 + 衬线大字标 */}
        <div className="relative border-b border-border px-6 pb-6 pt-8">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(320px 110px at 30% -20%, rgba(217,119,6,.09), transparent 70%)',
            }}
          />
          <p className="relative font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-primary">
            Index
          </p>
          <SheetTitle className="relative mt-3 font-serif text-3xl font-black tracking-tight">
            李自在
          </SheetTitle>
          <p className="relative mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Zizai Blog · Data × AI × Content
          </p>
          <SheetDescription className="sr-only">
            {t('menuDescription')}
          </SheetDescription>
        </div>

        {/* 导航列表：mono 序号 + hairline 分隔（杂志目录感） */}
        <nav className="flex-1 overflow-y-auto">
          {NAV_LINKS.map((link, i) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'group relative flex items-center gap-4 border-b border-border/60 px-6 py-3.5 transition-colors',
                  active ? 'bg-muted/40' : 'hover:bg-muted/30'
                )}
              >
                {/* 激活态金色左 rule */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-primary transition-opacity',
                    active ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span
                  className={cn(
                    'w-5 shrink-0 font-mono text-[10px] font-medium tracking-[0.18em] transition-colors',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground/50 group-hover:text-muted-foreground'
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'text-[15px] transition-colors',
                    active
                      ? 'font-semibold text-foreground'
                      : link.accent
                        ? 'text-foreground/85 group-hover:text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {t(link.labelKey)}
                </span>
                {/* 简历 accent 项：右缀金色 mono 标 */}
                {link.accent && (
                  <span className="ml-auto shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-primary/90">
                    ◆ Resume
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* 底部：订阅主 CTA + 语言切换 + mono 装饰尾行 */}
        <div className="border-t border-border px-6 py-5">
          <Link href="/subscribe" onClick={() => setOpen(false)}>
            <Button className="h-11 w-full rounded-md bg-primary font-medium hover:bg-primary/90">
              {t('subscribe')}
            </Button>
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <LanguageSwitcher variant="text" />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
              Est. 2026
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
