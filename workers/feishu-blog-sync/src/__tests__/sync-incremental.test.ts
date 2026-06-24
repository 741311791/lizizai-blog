/**
 * sync.ts 增量同步逻辑单元测试
 *
 * 验证多内容类型文件夹的「各类型独立高水位」增量判断。
 * 核心场景：播客/PPT 晚于文章生成（mtime 天然偏大），必须用各自高水位比对，
 * 而非拿文章 mtime 做基准——后者会导致增量永久失效、每次全量重传。
 *
 * 运行: npx tsx src/__tests__/sync-incremental.test.ts
 */

import { blogFolderNeedsSync, maxModifiedTime } from '../sync';
import type { FeishuFile } from '../feishu';
import type { ArticleMeta } from '../sync';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

function file(name: string, token: string, type: string, mtime: number): FeishuFile {
  return { name, token, type, created_time: '0', modified_time: String(mtime) };
}

/** mock FeishuClient：folderToken → 文件列表 */
function mockClient(folderMap: Record<string, FeishuFile[]>) {
  return {
    listFiles: async (token: string) => folderMap[token] || [],
  } as unknown as import('../feishu').FeishuClient;
}

/** 构造一个多内容类型文章的缓存 meta */
function cachedMeta(checkpoints?: { article?: string; podcast?: string; slides?: string }): ArticleMeta {
  return {
    slug: 'ai-daily',
    title: '测试日报',
    category: { name: 'Daily News', slug: 'daily-news' },
    publishedAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    readingTime: 5,
    feishuDocToken: 'DOC',
    blogFolderToken: 'BLOG',
    contentTypes: { article: true as const, syncCheckpoints: checkpoints },
  };
}

const BLOG_FOLDER = file('李自在AI 日报', 'BLOG', 'folder', 100);
const iso = (sec: number) => new Date(sec * 1000).toISOString();

async function main() {
  console.log('\n── 测试: blogFolderNeedsSync() 增量高水位判断 ──\n');

  // 1. 无 checkpoint（新文章 / 旧数据未回写）→ 需要同步
  {
    const client = mockClient({
      BLOG: [file('文章', 'AF', 'folder', 100)],
      AF: [file('doc.docx', 'DOC', 'docx', 100)],
    });
    const r = await blogFolderNeedsSync(client, BLOG_FOLDER, new Map([['DOC', cachedMeta(undefined)]]));
    assert(r.needsSync === true, '1. 无 checkpoint → 需要同步');
  }

  // 2. 【核心修复点】播客 mtime > 文章 mtime，但各类型均 ≤ 自身 checkpoint → 跳过
  //    （旧逻辑拿文章 mtime 做基准会错误地全量重传）
  {
    const client = mockClient({
      BLOG: [file('文章', 'AF', 'folder', 100), file('播客', 'PF', 'folder', 100)],
      AF: [file('doc.docx', 'DOC', 'docx', 100)],
      PF: [file('ep.mp3', 'EP', 'file', 300)],  // 播客晚于文章生成，mtime=300
    });
    const r = await blogFolderNeedsSync(client, BLOG_FOLDER, new Map([
      ['DOC', cachedMeta({ article: iso(100), podcast: iso(300) })],
    ]));
    assert(r.needsSync === false, '2. 播客 mtime(300)>文章(100) 但 ≤自身checkpoint → 跳过（核心修复）');
  }

  // 3. 某类型 mtime > 自身 checkpoint → 需要同步
  {
    const client = mockClient({
      BLOG: [file('文章', 'AF', 'folder', 100), file('播客', 'PF', 'folder', 100)],
      AF: [file('doc.docx', 'DOC', 'docx', 100)],
      PF: [file('ep.mp3', 'EP', 'file', 500)],  // 新增/更新播客
    });
    const r = await blogFolderNeedsSync(client, BLOG_FOLDER, new Map([
      ['DOC', cachedMeta({ article: iso(100), podcast: iso(300) })],
    ]));
    assert(r.needsSync === true, '3. 播客更新(500>300) → 需要同步');
  }

  // 4. 文章本体更新（mtime > checkpoint）→ 需要同步
  {
    const client = mockClient({
      BLOG: [file('文章', 'AF', 'folder', 100)],
      AF: [file('doc.docx', 'DOC', 'docx', 250)],  // 文章被编辑
    });
    const r = await blogFolderNeedsSync(client, BLOG_FOLDER, new Map([
      ['DOC', cachedMeta({ article: iso(100) })],
    ]));
    assert(r.needsSync === true, '4. 文章更新(250>100) → 需要同步');
  }

  // 5. PPT 类型独立判断（不互相干扰）
  {
    const client = mockClient({
      BLOG: [file('文章', 'AF', 'folder', 100), file('PPT', 'SF', 'folder', 100)],
      AF: [file('doc.docx', 'DOC', 'docx', 100)],
      SF: [file('index.html', 'IDX', 'file', 400)],
    });
    const r = await blogFolderNeedsSync(client, BLOG_FOLDER, new Map([
      ['DOC', cachedMeta({ article: iso(100), slides: iso(400) })],
    ]));
    assert(r.needsSync === false, '5. PPT 各类型均 ≤ checkpoint → 跳过');
  }

  console.log('\n── 测试: maxModifiedTime() ──\n');
  {
    const files = [file('a', '1', 'file', 100), file('b', '2', 'file', 300), file('c', '3', 'file', 50)];
    assert(maxModifiedTime(files) === 300, '6. 取最大 mtime');
    assert(maxModifiedTime([]) === 0, '7. 空数组返回 0');
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`  通过: ${passed}  失败: ${failed}`);
  console.log(`═══════════════════════════════\n`);
  if (failed > 0) process.exit(1);
}

main();
