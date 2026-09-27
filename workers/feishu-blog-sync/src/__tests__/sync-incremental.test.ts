/**
 * sync.ts 增量同步逻辑单元测试
 *
 * 验证多内容类型文件夹的「各类型独立高水位」增量判断。
 * 核心场景：播客/PPT 晚于文章生成（mtime 天然偏大），必须用各自高水位比对，
 * 而非拿文章 mtime 做基准——后者会导致增量永久失效、每次全量重传。
 *
 * 2026-09-28 增补：检查点口径一致性测试。判断侧（blogFolderNeedsSync）取类型子文件夹
 * 顶层列表 max mtime（含 screenshots 等子文件夹条目），写入侧必须同口径——否则飞书
 * 文件夹 mtime（恒晚于内部文件 1–2 秒）会让检查点永远偏小，每轮全量重传、超时停更。
 *
 * 运行: npx tsx src/__tests__/sync-incremental.test.ts
 */

import { blogFolderNeedsSync, maxModifiedTime, syncSlidesFolder, syncHtmlFolder } from '../sync';
import type { FeishuFile } from '../feishu';
import type { ArticleMeta, CategoryInfo, R2Bucket } from '../sync';

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

/** mock 同步用 FeishuClient：区分顶层列表（含子文件夹）与递归文件列表（含 path） */
function mockSyncClient(opts: {
  topLevel: Record<string, FeishuFile[]>;
  recursive: Record<string, Array<FeishuFile & { path: string }>>;
}) {
  return {
    listFiles: async (token: string) => opts.topLevel[token] || [],
    listAllFilesRecursive: async (token: string) => opts.recursive[token] || [],
    downloadDriveFile: async () => new TextEncoder().encode('<html><body>x</body></html>'),
  } as unknown as import('../feishu').FeishuClient;
}

/** mock R2Bucket：记录 put 的 key */
function mockR2(): { r2: R2Bucket; puts: string[] } {
  const puts: string[] = [];
  return {
    puts,
    r2: {
      put: async (key: string) => { puts.push(key); },
      get: async () => null,
      list: async () => ({ objects: [], truncated: false }),
      delete: async () => {},
    } as unknown as R2Bucket,
  };
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
const CATEGORY: CategoryInfo = { name: 'Daily News', slug: 'daily-news', description: '', folderToken: 'CAT' };
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

  console.log('\n── 测试: 检查点口径一致性（2026-09-28 修复根因）──\n');

  // 8. 【根因回归】顶层列表含子文件夹条目（screenshots mtime 402 > 内部文件 400）：
  //    检查点按同口径记 402 → 跳过；旧口径只记文件 mtime(400) → 永久判需同步
  {
    const client = mockClient({
      BLOG: [file('文章', 'AF', 'folder', 100), file('PPT', 'SF', 'folder', 100)],
      AF: [file('doc.docx', 'DOC', 'docx', 100)],
      SF: [file('index.html', 'IDX', 'file', 400), file('screenshots', 'SS', 'folder', 402)],
    });
    const ok = await blogFolderNeedsSync(client, BLOG_FOLDER, new Map([
      ['DOC', cachedMeta({ article: iso(100), slides: iso(402) })],
    ]));
    assert(ok.needsSync === false, '8a. 检查点=顶层max(402，含子文件夹条目) → 跳过');
    const stale = await blogFolderNeedsSync(client, BLOG_FOLDER, new Map([
      ['DOC', cachedMeta({ article: iso(100), slides: iso(400) })],
    ]));
    assert(stale.needsSync === true, '8b. 检查点=仅文件max(400，旧口径) → 判需同步（修复前每轮全量重传）');
  }

  // 9. syncSlidesFolder 返回的检查点取顶层 max（含 screenshots 文件夹条目）
  {
    const client = mockSyncClient({
      topLevel: {
        SF: [file('index.html', 'IDX', 'file', 400), file('slides', 'SL', 'folder', 401), file('screenshots', 'SS', 'folder', 402)],
      },
      recursive: {
        SF: [
          { ...file('index.html', 'IDX', 'file', 400), path: 'index.html' },
          { ...file('1-intro.html', 'S1', 'file', 400), path: 'slides/1-intro.html' },
          { ...file('1.png', 'P1', 'file', 400), path: 'screenshots/1.png' },
        ],
      },
    });
    const { r2 } = mockR2();
    const meta = await syncSlidesFolder(client, file('PPT', 'SF', 'folder', 100), 'ai-daily-2026-09-26', CATEGORY, r2, 'blog-data');
    assert(meta !== undefined, '9a. slides 同步成功');
    assert(meta!.maxModifiedTime === 402, `9b. slides 检查点=顶层max(402，含子文件夹)，实测 ${meta?.maxModifiedTime}`);
    assert(meta!.slideCount === 1, `9c. slideCount=1，实测 ${meta?.slideCount}`);
  }

  // 10. syncHtmlFolder 返回的检查点取顶层 max（含资源子文件夹条目）
  {
    const client = mockSyncClient({
      topLevel: {
        HF: [file('main.html', 'MH', 'file', 500), file('assets', 'AS', 'folder', 502)],
      },
      recursive: {
        HF: [
          { ...file('main.html', 'MH', 'file', 500), path: 'main.html' },
          { ...file('theme.css', 'CS', 'file', 500), path: 'assets/theme.css' },
        ],
      },
    });
    const { r2 } = mockR2();
    const meta = await syncHtmlFolder(client, file('html', 'HF', 'folder', 100), 'ai-daily-2026-09-26', CATEGORY, r2, 'blog-data', 'https://example.com');
    assert(meta !== undefined, '10a. html 同步成功');
    assert(meta!.maxModifiedTime === 502, `10b. html 检查点=顶层max(502，含子文件夹)，实测 ${meta?.maxModifiedTime}`);
    assert(
      meta!.htmlUrl === 'https://example.com/blog-data/articles/daily-news/ai-daily-2026-09-26/html/index.html',
      `10c. htmlUrl 正确，实测 ${meta?.htmlUrl}`,
    );
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`  通过: ${passed}  失败: ${failed}`);
  console.log(`═══════════════════════════════\n`);
  if (failed > 0) process.exit(1);
}

main();
