import { setRequestLocale } from 'next-intl/server';
import LegalPage, { legalMetadata, type LegalSection } from '@/components/legal/LegalPage';
import type { Metadata } from 'next';

const PATH = 'privacy';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata({ locale, ns: 'privacy', path: PATH });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections: LegalSection[] = [
    {
      id: 'collect',
      title: '我们收集的信息',
      content: (
        <ul>
          <li><strong>评论信息</strong>：当你在文章下方发表评论时，我们会收集你填写的昵称和邮箱地址。</li>
          <li><strong>浏览数据</strong>：我们通过 Cloudflare Workers 收集匿名的页面浏览量数据，用于了解文章受欢迎程度。</li>
          <li><strong>邮件订阅</strong>：订阅通过 Substack 完成，邮箱地址由 Substack 直接收集和处理，本博客不存储订阅邮箱。</li>
        </ul>
      ),
    },
    {
      id: 'usage',
      title: '信息用途',
      content: (
        <ul>
          <li>改善博客内容和用户体验</li>
          <li>防止垃圾评论和滥用行为</li>
          <li>分析网站流量趋势</li>
        </ul>
      ),
    },
    {
      id: 'third-party',
      title: '第三方服务',
      content: (
        <ul>
          <li><strong>Cloudflare</strong>：用于网站托管、分析、评论系统和数据存储（D1 数据库、R2 存储）。</li>
          <li><strong>Substack</strong>：用于邮件订阅服务，订阅者的邮箱由 Substack 收集和处理。</li>
          <li><strong>Vercel</strong>：用于网站前端部署。</li>
        </ul>
      ),
    },
    {
      id: 'cookies',
      title: 'Cookie 使用',
      content: (
        <>
          <p>我们使用极少量的 Cookie：</p>
          <ul>
            <li>管理后台会话 Cookie（仅在你登录后台时使用）</li>
          </ul>
        </>
      ),
    },
    {
      id: 'rights',
      title: '你的权利',
      content: (
        <p>
          你有权要求查看、修改或删除你的个人数据。如需操作，请通过邮箱{' '}
          <a
            href="mailto:liancheng.ly@gmail.com"
            className="text-primary hover:underline"
          >
            liancheng.ly@gmail.com
          </a>{' '}
          与我们取得联系。
        </p>
      ),
    },
    {
      id: 'security',
      title: '数据安全',
      content: (
        <p>
          所有数据通过 Cloudflare 的安全基础设施存储和传输，使用 HTTPS 加密。我们不会出售、交易或以其他方式向第三方转让你的个人信息。
        </p>
      ),
    },
  ];

  return <LegalPage locale={locale} ns="privacy" sections={sections} />;
}
