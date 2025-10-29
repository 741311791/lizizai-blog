'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages that should not have Header and Footer
  const standalonePages = ['/login', '/subscribe'];
  const isStandalonePage = standalonePages.includes(pathname);

  if (isStandalonePage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
