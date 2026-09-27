'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher({ variant = 'icon' }: { variant?: 'icon' | 'text' }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const nextLocale = locale === 'en' ? 'zh' : 'en';
    // push 而非 replace：语言切换后浏览器返回键可回退
    router.push(pathname, { locale: nextLocale });
  };

  if (variant === 'text') {
    return (
      <button
        onClick={switchLocale}
        className="px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
      >
        <Languages className="h-4 w-4" />
        {locale === 'en' ? '中文' : 'English'}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="shrink-0 text-xs font-medium px-2"
      aria-label={locale === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      {locale === 'en' ? '中' : 'EN'}
    </Button>
  );
}
