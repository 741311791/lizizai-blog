import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import CounterscaleScript from "@/components/analytics/CounterscaleScript";
import { Toaster } from "sonner";
import { generateDefaultMetadata, generateWebsiteJsonLd } from "@/lib/seo";

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
      <body className="antialiased">
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
