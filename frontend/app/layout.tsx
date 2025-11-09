import type { Metadata } from "next";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { Toaster } from "sonner";
import { generateDefaultMetadata, generateWebsiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = generateDefaultMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = generateWebsiteJsonLd();

  return (
    <html lang="zh-CN" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
