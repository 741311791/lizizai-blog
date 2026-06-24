/**
 * 增量同步逻辑只读诊断脚本（不写 R2）
 *
 * 两阶段验证修复后的增量判断：
 *   阶段 1：线上真实 articles.json（无 syncCheckpoints）→ 预期多内容文章全部 needsSync
 *   阶段 2：模拟"同步后"（checkpoint = 当前各文件夹 max mtime）→ 预期全部跳过
 *
 * 运行: cd workers/feishu-blog-sync && npx tsx src/debug-incremental.ts
 *
 * 全程只读：飞书 listFiles + R2 get(articles.json)，绝不执行 put。
 */

import * as fs from 'fs';
import * as path from 'path';
import { FeishuClient, type FeishuFile } from './feishu';
import { R2Client } from './lib/r2-client';
import { blogFolderNeedsSync, maxModifiedTime, type ArticleMeta } from './sync';

// ─── 加载环境变量（.env.local + shell）───
function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, '../../../.env.local');
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const ENV = { ...loadEnvLocal(), ...process.env };

/** 飞书子文件夹名 → 内容类型 */
function folderType(name: string): 'article' | 'podcast' | 'slides' | null {
  if (['文章', 'article'].includes(name)) return 'article';
  if (['播客', 'podcast'].includes(name)) return 'podcast';
  if (['PPT', 'ppt'].includes(name)) return 'slides';
  return null;
}

async function main() {
  console.log('[诊断] 加载环境变量...');
  const feishu = new FeishuClient(ENV.FEISHU_APP_ID!, ENV.FEISHU_APP_SECRET!);
  const r2 = new R2Client({
    endpoint: ENV.R2_ENDPOINT!,
    accessKeyId: ENV.R2_ACCESS_KEY_ID!,
    secretAccessKey: ENV.R2_SECRET_ACCESS_KEY!,
    bucket: ENV.R2_BUCKET_NAME || 'lizizai-blog',
  });
  const folderToken = ENV.FEISHU_FOLDER_TOKEN!;

  // ─── 读取线上 articles.json（只读）───
  console.log('[诊断] 读取 R2 articles.json（只读）...');
  const obj = await r2.get('blog-data/articles.json');
  const existing: ArticleMeta[] = obj ? JSON.parse(new TextDecoder().decode(await obj.arrayBuffer())) : [];
  const existingMap = new Map(existing.map(a => [a.feishuDocToken, a]));
  console.log(`[诊断] 线上现有 ${existing.length} 篇文章\n`);

  // ─── listFiles 缓存（避免重复 API 调用 + 限速保护）───
  const listCache = new Map<string, FeishuFile[]>();
  const mockClient = {
    listFiles: async (token: string): Promise<FeishuFile[]> => {
      if (listCache.has(token)) return listCache.get(token)!;
      const items = await feishu.listFiles(token);
      listCache.set(token, items);
      await new Promise(r => setTimeout(r, 40));
      return items;
    },
  } as unknown as FeishuClient;

  // ─── 扫描所有分类，收集文章项 ───
  console.log('[诊断] 扫描飞书文件夹结构（首次访问各 token）...\n');
  const rootFiles = await mockClient.listFiles(folderToken);
  const categories = rootFiles.filter(f => f.type === 'folder');

  const folderArticles: FeishuFile[] = [];  // 多内容类型文件夹
  const docxArticles: FeishuFile[] = [];    // 单 docx
  for (const cat of categories) {
    const items = await mockClient.listFiles(cat.token);
    for (const item of items) {
      if (item.type === 'folder') folderArticles.push(item);
      else if (item.type === 'docx') docxArticles.push(item);
    }
  }
  console.log(`[诊断] 多内容文件夹文章: ${folderArticles.length}，单 docx 文章: ${docxArticles.length}\n`);

  // ─── 阶段 1：线上真实状态 ───
  console.log('════════ 阶段 1: 线上真实状态（articles.json 无 syncCheckpoints）════════');
  let p1Need = 0, p1Skip = 0, p1NoCp = 0, p1NoCache = 0;
  for (const folder of folderArticles) {
    const cached = [...existingMap.values()].find(a => a.blogFolderToken === folder.token);
    if (!cached) { p1NoCache++; continue; }
    const r = await blogFolderNeedsSync(mockClient, folder, existingMap);
    if (r.needsSync) {
      p1Need++;
      if (!cached.contentTypes?.syncCheckpoints) p1NoCp++;
    } else p1Skip++;
  }
  console.log(`  多内容文件夹文章（共 ${folderArticles.length}）:`);
  console.log(`    needsSync=true : ${p1Need}  ← 符合预期（首次需建立 checkpoint）`);
  console.log(`    needsSync=false: ${p1Skip}`);
  console.log(`    其中无 checkpoint: ${p1NoCp}（这正是历史上每次全量重传的根因）`);
  console.log(`    无 cached 记录 : ${p1NoCache}\n`);

  // ─── 构造模拟 checkpoint（= 当前各子文件夹 max mtime，即"同步后会写入的值"）───
  const simulatedMap = new Map(existingMap);
  for (const folder of folderArticles) {
    const cached = [...existingMap.values()].find(a => a.blogFolderToken === folder.token);
    if (!cached) continue;
    const subItems = await mockClient.listFiles(folder.token);
    const cp: { article?: string; podcast?: string; slides?: string } = {};
    for (const s of subItems) {
      if (s.type !== 'folder') continue;
      const t = folderType(s.name);
      if (!t) continue;
      const files = await mockClient.listFiles(s.token);
      const m = maxModifiedTime(files);
      if (m > 0) cp[t] = new Date(m * 1000).toISOString();
    }
    simulatedMap.set(cached.feishuDocToken, {
      ...cached,
      contentTypes: { article: true as const, ...cached.contentTypes, syncCheckpoints: cp },
    });
  }

  // ─── 阶段 2：模拟"同步后" ───
  console.log('════════ 阶段 2: 模拟"同步后"（已写入 syncCheckpoints）════════');
  let p2Need = 0, p2Skip = 0;
  const stillNeed: string[] = [];
  for (const folder of folderArticles) {
    const cached = [...simulatedMap.values()].find(a => a.blogFolderToken === folder.token);
    if (!cached) continue;
    const r = await blogFolderNeedsSync(mockClient, folder, simulatedMap);
    if (r.needsSync) { p2Need++; stillNeed.push(folder.name); }
    else p2Skip++;
  }
  const p2Total = p2Need + p2Skip;
  console.log(`  多内容文件夹文章（共 ${p2Total}）:`);
  console.log(`    needsSync=false: ${p2Skip}  ← 增量生效，正确跳过未修改文章`);
  console.log(`    needsSync=true : ${p2Need}`);
  if (stillNeed.length > 0 && stillNeed.length <= 10) {
    console.log(`    仍需同步的: ${stillNeed.join(' | ')}`);
  }

  // ─── 结论 ───
  console.log('\n════════ 结论 ════════');
  if (p2Total > 0 && p2Need === 0) {
    console.log('  ✅ 增量逻辑验证通过');
    console.log(`     阶段1（无 checkpoint）: ${p1Need}/${p1Need + p1Skip} 需同步（符合首次预期）`);
    console.log(`     阶段2（有 checkpoint）: ${p2Skip}/${p2Total} 正确跳过`);
    console.log('     → checkpoints 建立后，未修改的多内容文章全部跳过，不再全量重传');
  } else {
    console.log(`  ❌ 增量逻辑异常：阶段 2 仍有 ${p2Need}/${p2Total} 篇被判定需同步`);
  }
  console.log('');
}

main().catch(err => {
  console.error('[诊断] 错误:', err);
  process.exit(1);
});
