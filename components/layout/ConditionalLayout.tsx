'use client';

import { usePathname } from '@/i18n/navigation';
import Header from './Header';
import Footer from './Footer';
import BackToTop from '@/components/ui/BackToTop';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages that should not have Header and Footer
  const standalonePages = ['/login', '/subscribe', '/admin'];
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
      <BackToTop />
    </>
  );
}
