/**
 * 飞书博客同步 Worker
 *
 * 定时任务：每天自动同步
 * HTTP 触发：手动同步（需验证 SYNC_TOKEN）
 */

import { performSync } from './sync';

// CORS 头
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
  SYNC_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 处理 CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 手动同步端点
    if (url.pathname === '/sync' && request.method === 'POST') {
      const token = request.headers.get('X-Sync-Token');
      if (token !== env.SYNC_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const result = await performSync({
        R2: env.R2,
        FEISHU_APP_ID: env.FEISHU_APP_ID,
        FEISHU_APP_SECRET: env.FEISHU_APP_SECRET,
        FEISHU_FOLDER_TOKEN: env.FEISHU_FOLDER_TOKEN,
        R2_BASE_PATH: env.R2_BASE_PATH || 'blog-data',
        R2_PUBLIC_URL: `https://${url.host}`,
      });

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 获取同步状态
    if (url.pathname === '/status') {
      try {
        const obj = await env.R2.get(`${env.R2_BASE_PATH}/articles.json`);
        if (!obj) {
          return new Response(JSON.stringify({ synced: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        const data = JSON.parse(new TextDecoder().decode(await obj.arrayBuffer()));
        return new Response(JSON.stringify({
          synced: true,
          articleCount: data.length,
          lastSync: new Date().toISOString(),
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },

  // 定时触发器（每天执行）
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log('Scheduled sync triggered at', new Date().toISOString());

    const result = await performSync({
      R2: env.R2,
      FEISHU_APP_ID: env.FEISHU_APP_ID,
      FEISHU_APP_SECRET: env.FEISHU_APP_SECRET,
      FEISHU_FOLDER_TOKEN: env.FEISHU_FOLDER_TOKEN,
      R2_BASE_PATH: env.R2_BASE_PATH || 'blog-data',
      R2_PUBLIC_URL: 'https://cdn.lizizai.xyz',
    });

    console.log('Scheduled sync result:', result);
  },
};

// R2 Bucket 类型定义
interface R2Bucket {
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  put(key: string, value: ArrayBuffer | string, options?: any): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }>;
  delete(key: string): Promise<void>;
}
