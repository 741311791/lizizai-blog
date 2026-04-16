import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策',
  description: 'Zizai Blog 隐私政策',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">隐私政策</h1>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-sm text-muted-foreground">最后更新：2026 年 4 月</p>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">我们收集的信息</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong className="text-foreground">评论信息</strong>：当你在文章下方发表评论时，我们会收集你填写的昵称和邮箱地址。</li>
            <li><strong className="text-foreground">浏览数据</strong>：我们通过 Cloudflare Workers 收集匿名的页面浏览量数据，用于了解文章受欢迎程度。</li>
            <li><strong className="text-foreground">邮件地址</strong>：如果你订阅了我们的邮件通知，我们会保存你的邮箱地址用于发送更新。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">信息用途</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>改善博客内容和用户体验</li>
            <li>防止垃圾评论和滥用行为</li>
            <li>向你发送订阅的邮件通知（仅在你主动订阅的情况下）</li>
            <li>分析网站流量趋势</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">第三方服务</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong className="text-foreground">Cloudflare</strong>：用于网站托管、分析、评论系统和数据存储（D1 数据库、R2 存储）。</li>
            <li><strong className="text-foreground">Resend</strong>：用于发送邮件订阅通知。</li>
            <li><strong className="text-foreground">Vercel</strong>：用于网站前端部署。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">Cookie 使用</h2>
          <p className="text-sm">我们使用极少量的 Cookie：</p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>管理后台会话 Cookie（仅在你登录后台时使用）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">你的权利</h2>
          <p className="text-sm">
            你有权要求查看、修改或删除你的个人数据。如需操作，请通过博客上提供的联系方式与我们取得联系。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">数据安全</h2>
          <p className="text-sm">
            所有数据通过 Cloudflare 的安全基础设施存储和传输，使用 HTTPS 加密。我们不会出售、交易或以其他方式向第三方转让你的个人信息。
          </p>
        </section>
      </div>
    </div>
  );
}
