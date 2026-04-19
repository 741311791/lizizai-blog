import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: Request) {
  return intlMiddleware(request as any);
}

export const config = {
  // 匹配所有路径，排除 api、admin、_next、静态资源等
  matcher: '/((?!api|admin|_next|_vercel|feed\\.xml|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
};
