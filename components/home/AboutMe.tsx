'use client';

import Image from 'next/image';
import { Twitter, Youtube, Linkedin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AboutMe() {
  const t = useTranslations('home');

  return (
    <section className="relative py-20">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-sm tracking-[0.3em] text-muted-foreground uppercase">{t('aboutLabel')}</p>
          <h1 className="text-5xl md:text-6xl font-bold">{t('aboutTitle')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('aboutSubtitle')}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12 items-start mb-12">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-8">
            <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden border-4 border-border">
              <Image
                src="/avator/avatar_smile.png"
                alt="Zizai Li"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Social Icons */}
            <div className="flex gap-6 justify-center">
              <a
                href="https://twitter.com/zizaiblog"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={28} />
              </a>
              <a
                href="https://youtube.com/@zizaili"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={28} />
              </a>
              <a
                href="https://www.linkedin.com/in/zizai-li"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={28} />
              </a>
            </div>
          </div>

          {/* Bio Text */}
          <div className="space-y-6 text-lg leading-relaxed">
            <h2 className="text-4xl font-bold mb-6">{t('greeting')}</h2>

            <p className="text-foreground/80">
              {t('bioParagraph1')}
            </p>

            <p className="text-foreground/80">
              {t('bioParagraph2')}
            </p>

            <p className="text-foreground font-semibold">
              {t('bioParagraph3')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
