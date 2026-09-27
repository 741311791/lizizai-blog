import { setRequestLocale } from 'next-intl/server';
import LegalPage, { legalMetadata, type LegalSection } from '@/components/legal/LegalPage';
import type { Metadata } from 'next';

const PATH = 'terms';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata({ locale, ns: 'terms', path: PATH });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sections: LegalSection[] = [
    {
      id: 'copyright',
      title: '内容版权',
      content: (
        <p>
          本博客所有原创内容的版权归 Zizai Blog 所有。文章内容可供个人学习和参考使用，
          但未经授权不得商业性转载、复制或分发。转载请注明出处并提供原文链接。
        </p>
      ),
    },
    {
      id: 'comments',
      title: '评论规范',
      content: (
        <>
          <p>发表评论时，请遵守以下规则：</p>
          <ul>
            <li>尊重他人，不得使用侮辱性、歧视性或攻击性语言</li>
            <li>不得发布广告、垃圾信息或恶意链接</li>
            <li>不得发布侵犯他人隐私或知识产权的内容</li>
            <li>保留删除不当评论的权利，恕不另行通知</li>
          </ul>
        </>
      ),
    },
    {
      id: 'disclaimer',
      title: '免责声明',
      content: (
        <ul>
          <li>博客文章中的观点仅代表作者个人，不构成专业建议</li>
          <li>文章内容按「原样」提供，不保证准确性、完整性或时效性</li>
          <li>对于因使用本站信息而造成的任何损失，我们不承担责任</li>
        </ul>
      ),
    },
    {
      id: 'external-links',
      title: '外部链接',
      content: (
        <p>
          本博客可能包含指向第三方网站的链接。这些链接仅为方便读者而提供，
          我们对第三方网站的内容、隐私政策或做法不承担任何责任。
        </p>
      ),
    },
    {
      id: 'changes',
      title: '条款变更',
      content: (
        <p>
          我们保留随时修改这些条款的权利。继续使用本网站即表示你接受修改后的条款。
        </p>
      ),
    },
  ];

  return <LegalPage locale={locale} ns="terms" sections={sections} />;
}
