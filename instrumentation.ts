/**
 * Next.js instrumentation：server 实例（dev / build SSG worker / 生产）启动时执行一次
 *
 * instrumentation 在 Edge Runtime 也会被加载，Node-only 逻辑拆到 instrumentation.node.ts，
 * 仅在 nodejs 运行时动态引入，避免 Edge 打包 node:dns。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setup } = await import('./instrumentation.node');
    await setup();
  }
}
