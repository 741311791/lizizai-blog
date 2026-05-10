/**
 * 飞书博客同步 Worker（只读服务）
 *
 * 同步逻辑已迁移到 GitHub Actions，Worker 仅保留只读端点：
 * - /health  健康检查
 * - /status  同步状态（读取 R2 中的 articles.json）
 * - /debug/feishu  调试飞书文件夹结构
 */

import { type SyncEnv, type R2Bucket } from './sync';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Token',
};

export interface Env {
  R2: R2Bucket;
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  FEISHU_FOLDER_TOKEN: string;
  R2_BASE_PATH: string;
  R2_PUBLIC_URL: string;
  SYNC_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 调试：查看飞书文件夹结构
    if (url.pathname === '/debug/feishu' && request.method === 'GET') {
      const token = request.headers.get('X-Sync-Token') || url.searchParams.get('token');
      if (token !== env.SYNC_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const { FeishuClient } = await import('./feishu');
      const client = new FeishuClient(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);
      const folderToken = url.searchParams.get('folder') || env.FEISHU_FOLDER_TOKEN;
      const items = await client.listFiles(folderToken);

      return new Response(JSON.stringify({ folderToken, items }, null, 2), {
        status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 同步状态（读取 R2 中的 articles.json）
    if (url.pathname === '/status') {
      try {
        const obj = await env.R2.get(`${env.R2_BASE_PATH || 'blog-data'}/articles.json`);
        if (!obj) {
          return new Response(JSON.stringify({ synced: false }), {
            status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        const data = JSON.parse(new TextDecoder().decode(await obj.arrayBuffer()));
        return new Response(JSON.stringify({
          synced: true,
          articleCount: data.length,
          lastSync: new Date().toISOString(),
        }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};
