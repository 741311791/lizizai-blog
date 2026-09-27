import { getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { siteConfig } from '@/lib/seo';
import type { Metadata } from 'next';

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalMetadataArgs {
  locale: string;
  /** messages 命名空间（privacy/terms/collection） */
  ns: string;
  /** 路由路径，如 'privacy' */
  path: string;
}

/** 法律页 metadata：随 locale 的 title/description + 自身 canonical/hreflang */
export async function legalMetadata({ locale, ns, path }: LegalMetadataArgs): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: ns });
  const isZh = locale === 'zh';
  const url = isZh ? `${siteConfig.url}/${path}` : `${siteConfig.url}/en/${path}`;
  return {
    title: t('title'),
    description: `${t('title')} - ${siteConfig.name}`,
    alternates: {
      canonical: url,
      languages: {
        zh: `${siteConfig.url}/${path}`,
        en: `${siteConfig.url}/en/${path}`,
      },
    },
  };
}

interface LegalPageProps extends Omit<LegalMetadataArgs, 'path'> {
  sections: LegalSection[];
}

/**
 * 法律页共享布局：标题 + 更新时间 + 锚点目录 + 分节正文。
 * 法律文本仅维护中文版；en 路由渲染提示条说明。
 */
export default async function LegalPage({ locale, ns, sections }: LegalPageProps) {
  const t = await getTranslations({ locale, namespace: ns });
  const tc = await getTranslations({ locale, namespace: 'common' });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4 text-balance">{t('title')}</h1>
      <p className="text-sm text-muted-foreground mb-2">{t('lastUpdated')}</p>

      {locale !== 'zh' && (
        <div className="mb-8 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          {tc('legalZhOnly')}
        </div>
      )}

      {/* 锚点目录 */}
      <nav aria-label={t('title')} className="mb-8 rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <FileText className="h-3 w-3" aria-hidden="true" />
          {t('title')}
        </div>
        <ul className="space-y-1">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="max-w-none space-y-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
            <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            <div className="space-y-3 text-sm text-muted-foreground [&_p]:text-pretty [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2 [&_strong]:text-foreground">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
