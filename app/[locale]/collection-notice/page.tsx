import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '信息收集声明',
  description: 'Zizai Blog 信息收集声明',
};

export default function CollectionNoticePage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">信息收集声明</h1>

      <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-sm text-muted-foreground">最后更新：2026 年 4 月</p>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">网站分析</h2>
          <p className="text-sm">
            我们使用 Cloudflare Workers 进行网站流量分析。该服务会对 IP 地址进行匿名化处理，
            不会追踪个人身份信息。收集的数据仅用于了解网站访问趋势和优化内容。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">评论数据</h2>
          <p className="text-sm">
            评论数据存储在 Cloudflare D1 数据库中。当你在文章下方发表评论时，我们会收集：
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>你填写的昵称</li>
            <li>评论内容</li>
            <li>评论时间</li>
          </ul>
          <p className="text-sm mt-2">
            评论数据不会与任何第三方共享。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">邮件订阅</h2>
          <p className="text-sm">
            邮件订阅通过 Resend 服务处理。当你订阅时，你的邮箱地址会被安全地存储用于发送更新通知。
            你可以随时取消订阅，取消后邮箱地址将从邮件列表中移除。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">数据不出售</h2>
          <p className="text-sm">
            我们承诺不出售、交易或以其他方式向外部第三方转让用户数据。
            所有数据收集仅用于运营和改善本博客服务。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">联系我们</h2>
          <p className="text-sm">
            如果你对数据收集有任何疑问或担忧，请通过博客上提供的联系方式与我们取得联系。
          </p>
        </section>
      </div>
    </div>
  );
}
