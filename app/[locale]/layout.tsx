import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Noto_Serif_SC, Noto_Sans_SC, Instrument_Sans } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import { routing } from '@/i18n/routing';
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import CounterscaleScript from "@/components/analytics/CounterscaleScript";
import { Toaster } from "sonner";
import { generateDefaultMetadata, generateWebsiteJsonLd } from "@/lib/seo";

/* 字体加载 — next/font 自动子集化优化 */
const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

/* GeistMono 预配置了 variable: "--font-geist-mono" */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateDefaultMetadata(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const websiteJsonLd = generateWebsiteJsonLd();

  return (
    <html lang={locale} className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${notoSerifSC.variable} ${notoSansSC.variable} ${instrumentSans.variable} ${GeistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </NextIntlClientProvider>
        <CounterscaleScript />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
