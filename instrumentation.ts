/**
 * Next.js instrumentation：server 实例（dev / build SSG worker / 生产）启动时执行一次
 *
 * 本机 IPv6 到 Cloudflare 不通而 IPv4 正常；Node DNS 默认 verbatim（IPv6 优先）会让
 * R2 fetch 先撞 IPv6 连接超时。next.config 里的 setDefaultResultOrder 只作用于主进程，
 * SSG worker 进程不继承，故在此注册——每个 worker 启动都会执行，根治构建超时。
 */
export async function register() {
  const dns = await import('node:dns');
  dns.setDefaultResultOrder('ipv4first');

  // 本地构建走代理时让内置 fetch 尊重 HTTPS_PROXY（Node 22 原生 fetch 不读该 env）；
  // undici 仅本地 devDependency，Vercel 运行时不可用时静默跳过保持直连
  if (process.env.HTTPS_PROXY || process.env.https_proxy) {
    try {
      const { EnvHttpProxyAgent, setGlobalDispatcher } = await import('undici');
      setGlobalDispatcher(new EnvHttpProxyAgent());
    } catch {
      // ignore: 无代理需求的环境直连即可
    }
  }
}
