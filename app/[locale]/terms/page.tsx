import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服务条款',
  description: 'Zizai Blog 服务条款',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">服务条款</h1>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-sm text-muted-foreground">最后更新：2026 年 4 月</p>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">内容版权</h2>
          <p className="text-sm">
            本博客所有原创内容的版权归 Zizai Blog 所有。文章内容可供个人学习和参考使用，
            但未经授权不得商业性转载、复制或分发。转载请注明出处并提供原文链接。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">评论规范</h2>
          <p className="text-sm">发表评论时，请遵守以下规则：</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>尊重他人，不得使用侮辱性、歧视性或攻击性语言</li>
            <li>不得发布广告、垃圾信息或恶意链接</li>
            <li>不得发布侵犯他人隐私或知识产权的内容</li>
            <li>保留删除不当评论的权利，恕不另行通知</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">免责声明</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>博客文章中的观点仅代表作者个人，不构成专业建议</li>
            <li>文章内容按「原样」提供，不保证准确性、完整性或时效性</li>
            <li>对于因使用本站信息而造成的任何损失，我们不承担责任</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">外部链接</h2>
          <p className="text-sm">
            本博客可能包含指向第三方网站的链接。这些链接仅为方便读者而提供，
            我们对第三方网站的内容、隐私政策或做法不承担任何责任。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">条款变更</h2>
          <p className="text-sm">
            我们保留随时修改这些条款的权利。继续使用本网站即表示你接受修改后的条款。
          </p>
        </section>
      </div>
    </div>
  );
}
