import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'A bilingual blog powered by Next.js and Strapi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
