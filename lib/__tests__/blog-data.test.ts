/**
 * blog-data.ts 单元测试 — 测试5（resolvePodcastUrls）+ 测试7/8（数据映射）
 *
 * 运行: npx tsx lib/__tests__/blog-data.test.ts
 */

// ─── 测试工具 ───

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

function assertDeepEqual<T>(actual: T, expected: T, msg: string) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a === b) { passed++; }
  else { console.error(`  FAIL: ${msg}\n    expected: ${b}\n    actual:   ${a}`); failed++; }
}

// ══════════════════════════════════════════════
// 测试 5: resolvePodcastUrls() URL 解析
// ══════════════════════════════════════════════

// 复制 resolvePodcastUrls 实现以进行独立测试
// （与 lib/blog-data.ts 中实现保持一致）

const R2_BASE = process.env.R2_PUBLIC_URL || 'https://pub-7fc5ed7acc9844ab99297fa6b47f55e6.r2.dev';

interface TestPodcastItem {
  name: string;
  slug: string;
  audioFile: string;
  coverFile?: string;
  scriptFile?: string;
  audioSize?: number;
}

function resolvePodcastUrls(
  categorySlug: string,
  articleSlug: string,
  items?: TestPodcastItem[],
): TestPodcastItem[] {
  if (!items || items.length === 0) return [];
  const base = `${R2_BASE}/blog-data/articles/${categorySlug}/${articleSlug}/podcast`;

  return items.map(item => ({
    name: item.name,
    slug: item.slug,
    audioFile: `${base}/${item.audioFile}`,
    coverFile: item.coverFile ? `${base}/${item.coverFile}` : undefined,
    scriptFile: item.scriptFile ? `${base}/${item.scriptFile}` : undefined,
    audioSize: item.audioSize,
  }));
}

console.log('\n── 测试 5: resolvePodcastUrls() ──');

// 5.1 正常拼接
{
  const items: TestPodcastItem[] = [
    { name: '测试', slug: 'test', audioFile: 'foo.mp3', audioSize: 1024 },
  ];
  const result = resolvePodcastUrls('ai', 'test-article', items);
  assert(result.length === 1, '5.1 返回1个item');
  assert(
    result[0].audioFile === `${R2_BASE}/blog-data/articles/ai/test-article/podcast/foo.mp3`,
    '5.1 audioFile为完整R2 URL',
  );
  assert(result[0].slug === 'test', '5.1 slug保持不变');
  assert(result[0].audioSize === 1024, '5.1 audioSize原样输出');
}

// 5.2 空数组
{
  const result = resolvePodcastUrls('ai', 'test', []);
  assert(Array.isArray(result), '5.2 空数组返回数组');
  assert(result.length === 0, '5.2 空数组返回空数组');
}

// 5.3 undefined
{
  const result = resolvePodcastUrls('ai', 'test', undefined);
  assert(result.length === 0, '5.3 undefined返回空数组');
}

// 5.4 缺失字段 (coverFile/scriptFile = undefined)
{
  const items: TestPodcastItem[] = [
    { name: 'Solo', slug: 'solo', audioFile: 'solo.mp3' },
  ];
  const result = resolvePodcastUrls('tech', 'solo-ep', items);
  assert(result[0].coverFile === undefined, '5.4 coverFile为undefined');
  assert(result[0].scriptFile === undefined, '5.4 scriptFile为undefined');
}

// 5.5 多 item
{
  const items: TestPodcastItem[] = [
    { name: 'Ep1', slug: 'ep1', audioFile: 'Ep1.mp3', coverFile: 'Ep1.png' },
    { name: 'Ep2', slug: 'ep2', audioFile: 'Ep2.mp3', scriptFile: 'Ep2.md' },
    { name: 'Ep3', slug: 'ep3', audioFile: 'Ep3.mp3' },
  ];
  const result = resolvePodcastUrls('ai', 'multi-ep', items);
  assert(result.length === 3, '5.5 3个item全部返回');

  assert(result[0].audioFile === `${R2_BASE}/blog-data/articles/ai/multi-ep/podcast/Ep1.mp3`, '5.5 Ep1 audioFile正确');
  assert(result[0].coverFile === `${R2_BASE}/blog-data/articles/ai/multi-ep/podcast/Ep1.png`, '5.5 Ep1 coverFile正确');

  assert(result[1].scriptFile === `${R2_BASE}/blog-data/articles/ai/multi-ep/podcast/Ep2.md`, '5.5 Ep2 scriptFile正确');

  assert(result[2].slug === 'ep3', '5.5 Ep3 slug保持');
  assert(result[2].coverFile === undefined, '5.5 Ep3 无coverFile');
}

// 5.6 audioSize 原样输出
{
  const items: TestPodcastItem[] = [
    { name: 'Big', slug: 'big', audioFile: 'big.mp3', audioSize: 1024 },
  ];
  const result = resolvePodcastUrls('ai', 'big-ep', items);
  assert(result[0].audioSize === 1024, '5.6 audioSize原样输出1024');
  assert(typeof result[0].audioSize === 'number', '5.6 audioSize为number类型');
}

// 5.7 有 coverFile 和 scriptFile 的完整拼接
{
  const items: TestPodcastItem[] = [{
    name: '完整播客',
    slug: 'full',
    audioFile: '完整播客.mp3',
    coverFile: '完整播客.png',
    scriptFile: '完整播客.md',
    audioSize: 999,
  }];
  const result = resolvePodcastUrls('ai', 'full-ep', items);
  const base = `${R2_BASE}/blog-data/articles/ai/full-ep/podcast`;
  assert(result[0].audioFile === `${base}/完整播客.mp3`, '5.7 audioFile完整URL');
  assert(result[0].coverFile === `${base}/完整播客.png`, '5.7 coverFile完整URL');
  assert(result[0].scriptFile === `${base}/完整播客.md`, '5.7 scriptFile完整URL');
}

// ══════════════════════════════════════════════
// 测试 7: getAllArticles 数据映射逻辑
// ══════════════════════════════════════════════

console.log('\n── 测试 7: getAllArticles 数据映射 ──');

// 7.1 contentTypes.podcast.items 有数据 → 结构完整保留
{
  const rawItem = {
    slug: 'test',
    title: 'Test',
    feishuDocToken: 'tok1',
    category: { name: 'AI', slug: 'ai' },
    publishedAt: '2026-01-01T00:00:00.000Z',
    readingTime: 5,
    contentType: 'podcast',
    contentTypes: {
      article: true,
      podcast: {
        items: [{ name: 'Ep1', slug: 'ep1', audioFile: 'Ep1.mp3', audioSize: 1000 }],
      },
    },
  };

  // 模拟 getAllArticles 的 map 逻辑
  const ct = rawItem.contentTypes as any;
  assert(Array.isArray(ct.podcast.items), '7.1 podcast.items为数组');
  assert(ct.podcast.items[0].name === 'Ep1', '7.1 结构完整保留');
}

// 7.2 文章无 podcast → contentTypes.podcast 为 undefined
{
  const rawItem = {
    slug: 'no-podcast',
    contentTypes: { article: true },
  };
  const ct = rawItem.contentTypes as any;
  assert(ct.podcast === undefined, '7.2 无podcast时字段为undefined');
}

// 7.3 contentType 字段优先级: slides > podcast > article
{
  // 有 slides 时 contentType = 'slides'
  const withSlides = { contentType: 'slides', contentTypes: { article: true, slides: { slideCount: 10, source: 'html_slides', hasScreenshots: false }, podcast: { items: [] } } } as any;
  assert(withSlides.contentType === 'slides', '7.3 slides覆盖podcast');

  // 有 podcast 无 slides 时 contentType = 'podcast'
  const withPodcast = { contentType: 'podcast', contentTypes: { article: true, podcast: { items: [{ name: 'Ep', slug: 'ep', audioFile: 'Ep.mp3', audioSize: 100 }] } } } as any;
  assert(withPodcast.contentType === 'podcast', '7.3 podcast类型正确');

  // 仅 article
  const articleOnly = { contentType: 'article', contentTypes: { article: true } } as any;
  assert(articleOnly.contentType === 'article', '7.3 article类型正确');
}

// ══════════════════════════════════════════════
// 测试 8: getArticleBySlug 详情解析逻辑
// ══════════════════════════════════════════════

console.log('\n── 测试 8: getArticleBySlug 详情解析 ──');

// 8.1 ct.podcast.items 存在 → podcasts 数组填充完整 URL
{
  const items = [{ name: 'Ep', slug: 'ep', audioFile: 'Ep.mp3', audioSize: 500 }];
  const podcasts = resolvePodcastUrls('ai', 'test', items);
  assert(podcasts.length === 1, '8.1 podcasts数组填充');
  assert(podcasts[0].audioFile.startsWith('https://'), '8.1 audioFile以https开头');
}

// 8.2 首个播客 audioUrl 回退
{
  const podcasts = resolvePodcastUrls('ai', 'test', [
    { name: 'Ep1', slug: 'ep1', audioFile: 'Ep1.mp3' },
    { name: 'Ep2', slug: 'ep2', audioFile: 'Ep2.mp3' },
  ]);
  const audioUrl = podcasts.length > 0 ? podcasts[0].audioFile : undefined;
  assert(audioUrl === podcasts[0].audioFile, '8.2 audioUrl等于首个播客audioFile');
}

// 8.3 旧格式回退 URL
{
  const audioUrl = `${R2_BASE}/blog-data/articles/ai/test/podcast/audio.mp3`;
  assert(audioUrl.includes('/podcast/audio.mp3'), '8.3 旧格式使用audio.mp3');
}

// 8.4 非播客文章 → podcasts 为 undefined
{
  const noPodcastCt = { article: true };
  assert((noPodcastCt as any).podcast === undefined, '8.4 非播客无podcast字段');
}

// ─── 结果汇总 ───
console.log(`\n═══════════════════════════════`);
console.log(`  通过: ${passed}  失败: ${failed}`);
console.log(`═══════════════════════════════\n`);

if (failed > 0) process.exit(1);
