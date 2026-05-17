/**
 * 飞书博客同步 CLI 入口
 *
 * 用法：npx tsx src/cli.ts
 * 在 GitHub Actions 或本地执行
 */

import { performSync, type SyncEnv, type SyncResult } from './sync';
import { R2Client } from './lib/r2-client';

async function main() {
  // 验证必要环境变量
  const required = [
    'FEISHU_APP_ID',
    'FEISHU_APP_SECRET',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`缺少环境变量: ${missing.join(', ')}`);
    process.exit(1);
  }

  // 从环境变量构建配置
  const env: SyncEnv = {
    R2: new R2Client({
      endpoint: process.env.R2_ENDPOINT!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucket: process.env.R2_BUCKET_NAME || 'lizizai-blog',
    }),
    FEISHU_APP_ID: process.env.FEISHU_APP_ID!,
    FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET!,
    FEISHU_FOLDER_TOKEN: process.env.FEISHU_FOLDER_TOKEN || 'RnSDfNdqZlcEtud4JjpcjtpKncg',
    R2_BASE_PATH: process.env.R2_BASE_PATH || 'blog-data',
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || 'https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev',
  };

  const args = process.argv.slice(2);
  const forceSync = args.includes('--force');

  console.log(`[sync] 开始${forceSync ? '全量' : '增量'}同步: ${new Date().toISOString()}`);
  const result = await performSync(env, forceSync);
  console.log(`[sync] 完成: ${result.articleCount} 篇文章 (同步: ${result.synced}, 跳过: ${result.skipped})`);
}

main().catch(err => {
  console.error('[sync] 致命错误:', err);
  process.exit(1);
});
