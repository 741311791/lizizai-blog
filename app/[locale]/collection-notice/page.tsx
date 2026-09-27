import { setRequestLocale } from 'next-intl/server';
import LegalPage, { legalMetadata, type LegalSection } from '@/components/legal/LegalPage';
import type { Metadata } from 'next';

const PATH = 'collection-notice';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata({ locale, ns: 'collection', path: PATH });
}

export default async function CollectionNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections: LegalSection[] = [
    {
      id: 'analytics',
      title: '网站分析',
      content: (
        <p>
          我们使用 Cloudflare Workers 进行网站流量分析。该服务会对 IP 地址进行匿名化处理，
          不会追踪个人身份信息。收集的数据仅用于了解网站访问趋势和优化内容。
        </p>
      ),
    },
    {
      id: 'comments',
      title: '评论数据',
      content: (
        <>
          <p>
            评论数据存储在 Cloudflare D1 数据库中。当你在文章下方发表评论时，我们会收集：
          </p>
          <ul>
            <li>你填写的昵称</li>
            <li>评论内容</li>
            <li>评论时间</li>
          </ul>
          <p>评论数据不会与任何第三方共享。</p>
        </>
      ),
    },
    {
      id: 'subscribe',
      title: '邮件订阅',
      content: (
        <p>
          邮件订阅通过 Substack 服务处理。当你在订阅入口输入邮箱后，将跳转至 Substack 完成订阅，你的邮箱地址由 Substack 直接收集和处理，用于发送更新通知。
          你可以随时取消订阅，具体参见 Substack 的隐私政策。
        </p>
      ),
    },
    {
      id: 'no-sale',
      title: '数据不出售',
      content: (
        <p>
          我们承诺不出售、交易或以其他方式向外部第三方转让用户数据。
          所有数据收集仅用于运营和改善本博客服务。
        </p>
      ),
    },
    {
      id: 'contact',
      title: '联系我们',
      content: (
        <p>
          如果你对数据收集有任何疑问或担忧，请通过邮箱{' '}
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
  ];

  return <LegalPage locale={locale} ns="collection" sections={sections} />;
}
