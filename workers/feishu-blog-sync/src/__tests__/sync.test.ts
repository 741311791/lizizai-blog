/**
 * sync.ts 单元测试 — 测试2（文件分组）、测试3（文件匹配）、测试4（JSON序列化）
 *
 * 运行: npx tsx src/__tests__/sync.test.ts
 */

import { groupFilesByBaseName, matchPodcastFiles, type PodcastFileMatch } from '../sync';
import type { FeishuFile } from '../feishu';
import type { ArticleMeta, PodcastItemMeta } from '../sync';

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

function makeFile(overrides: Partial<FeishuFile> = {}): FeishuFile {
  return {
    name: 'test.mp3',
    token: 'tok_' + Math.random().toString(36).slice(2, 8),
    type: 'file',
    created_time: '1717000000',
    modified_time: '1717000000',
    ...overrides,
  };
}

function summarize(groups: Map<string, FeishuFile[]>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of groups) out[k] = v.length;
  return out;
}

function summary(match: PodcastFileMatch | null): Record<string, string | undefined> | null {
  if (!match) return null;
  return {
    audioFile: match.audioFile.name,
    coverFile: match.coverFile?.name,
    scriptFile: match.scriptFile?.name,
    scriptDoc: match.scriptDoc?.name,
  };
}

// ══════════════════════════════════════════════
// 测试 2: groupFilesByBaseName()
// ══════════════════════════════════════════════

console.log('\n── 测试 2: groupFilesByBaseName() ──');

// 2.1 完整播客组
{
  const files = [
    makeFile({ name: 'foo.mp3' }),
    makeFile({ name: 'foo.png' }),
    makeFile({ name: 'foo.md' }),
  ];
  const groups = groupFilesByBaseName(files);
  assert(groups.size === 1, '2.1 完整播客组: size=1');
  assert(groups.get('foo')?.length === 3, '2.1 完整播客组: foo有3个文件');
}

// 2.2 单音频
{
  const files = [makeFile({ name: 'bar.mp3' })];
  const groups = groupFilesByBaseName(files);
  assert(groups.size === 1, '2.2 单音频: size=1');
  assert(groups.get('bar')?.length === 1, '2.2 单音频: bar有1个文件');
}

// 2.3 多组
{
  const files = [
    makeFile({ name: 'a.mp3' }),
    makeFile({ name: 'b.mp3' }),
  ];
  const groups = groupFilesByBaseName(files);
  assert(groups.size === 2, '2.3 多组: size=2');
  assert(groups.get('a')?.length === 1, '2.3 多组: a有1个文件');
  assert(groups.get('b')?.length === 1, '2.3 多组: b有1个文件');
}

// 2.4 空数组
{
  const groups = groupFilesByBaseName([]);
  assert(groups.size === 0, '2.4 空数组: size=0');
}

// 2.5 多点文件名
{
  const files = [makeFile({ name: 'a.b.c.mp3' })];
  const groups = groupFilesByBaseName(files);
  assert(groups.size === 1, '2.5 多点文件名: size=1');
  assert(groups.has('a.b.c'), '2.5 多点文件名: baseName=a.b.c');
}

// 2.6 过滤子文件夹
{
  const files = [
    { ...makeFile({ name: 'sub' }), type: 'folder' },
    makeFile({ name: 'foo.mp3' }),
  ];
  const groups = groupFilesByBaseName(files);
  assert(groups.size === 1, '2.6 过滤子文件夹: size=1');
  assert(!groups.has('sub'), '2.6 过滤子文件夹: sub被排除');
  assert(groups.has('foo'), '2.6 过滤子文件夹: foo存在');
}

// 2.7 仅图片无音频
{
  const files = [
    makeFile({ name: 'cover.png' }),
    makeFile({ name: 'desc.md' }),
  ];
  const groups = groupFilesByBaseName(files);
  assert(groups.size === 2, '2.7 仅图片无音频: size=2（不同文件名各自分组）');
  assert(groups.get('cover')?.length === 1, '2.7 仅图片无音频: cover有1个文件');
  assert(groups.get('desc')?.length === 1, '2.7 仅图片无音频: desc有1个文件');
}

// ══════════════════════════════════════════════
// 测试 3: matchPodcastFiles()
// ══════════════════════════════════════════════

console.log('\n── 测试 3: matchPodcastFiles() ──');

// 3.1 单播客仅 mp3
{
  const files = [makeFile({ name: 'pod.mp3' })];
  const m = matchPodcastFiles(files);
  assert(m !== null, '3.1 单播客仅mp3: 匹配成功');
  assert(m!.audioFile.name === 'pod.mp3', '3.1 单播客仅mp3: audioFile正确');
  assert(m!.coverFile === undefined, '3.1 单播客仅mp3: 无coverFile');
  assert(m!.scriptFile === undefined, '3.1 单播客仅mp3: 无scriptFile');
}

// 3.2 完整播客 (mp3 + png + md)
{
  const files = [
    makeFile({ name: 'ep1.mp3' }),
    makeFile({ name: 'ep1.png' }),
    makeFile({ name: 'ep1.md' }),
  ];
  const m = matchPodcastFiles(files);
  assert(m !== null, '3.2 完整播客: 匹配成功');
  assert(m!.coverFile?.name === 'ep1.png', '3.2 完整播客: coverFile=ep1.png');
  assert(m!.scriptFile?.name === 'ep1.md', '3.2 完整播客: scriptFile=ep1.md');
}

// 3.3 docx 文字稿
{
  const files = [
    makeFile({ name: 'talk.mp3' }),
    { ...makeFile({ name: 'talk.docx' }), type: 'docx' },
  ];
  const m = matchPodcastFiles(files);
  assert(m !== null, '3.3 docx文字稿: 匹配成功');
  assert(m!.scriptDoc?.name === 'talk.docx', '3.3 docx文字稿: scriptDoc=talk.docx');
  assert(m!.scriptFile === undefined, '3.3 docx文字稿: 无scriptFile(file型)');
}

// 3.4 无音频 → null
{
  const files = [
    makeFile({ name: 'cover.png' }),
    makeFile({ name: 'notes.md' }),
  ];
  const m = matchPodcastFiles(files);
  assert(m === null, '3.4 无音频: 返回null');
}

// 3.5 m4a/aac/wav 格式识别
{
  assert(matchPodcastFiles([makeFile({ name: 'test.m4a' })]) !== null, '3.5 m4a识别');
  assert(matchPodcastFiles([makeFile({ name: 'test.aac' })]) !== null, '3.5 aac识别');
  assert(matchPodcastFiles([makeFile({ name: 'test.wav' })]) !== null, '3.5 wav识别');
}

// 3.6 jpeg/webp 封面格式
{
  const jpeg = matchPodcastFiles([makeFile({ name: 'ep.mp3' }), makeFile({ name: 'ep.jpeg' })]);
  assert(jpeg?.coverFile?.name === 'ep.jpeg', '3.6 jpeg封面识别');
  const webp = matchPodcastFiles([makeFile({ name: 'ep.mp3' }), makeFile({ name: 'ep.webp' })]);
  assert(webp?.coverFile?.name === 'ep.webp', '3.6 webp封面识别');
}

// 3.7 txt 文字稿
{
  const files = [
    makeFile({ name: 'ep.mp3' }),
    makeFile({ name: 'ep.txt' }),
  ];
  const m = matchPodcastFiles(files);
  assert(m?.scriptFile?.name === 'ep.txt', '3.7 txt文字稿识别');
}

// ══════════════════════════════════════════════
// 测试 4: JSON 序列化格式
// ══════════════════════════════════════════════

console.log('\n── 测试 4: articles.json 写入格式验证 ──');

// 4.1 PodcastItemMeta 序列化
{
  const item: PodcastItemMeta = {
    name: '播客名称',
    slug: 'bo-ke-ming-cheng',
    audioFile: '播客名称.mp3',
    coverFile: '播客名称.png',
    scriptFile: '播客名称.md',
    audioSize: 12345678,
  };
  const json = JSON.stringify(item);
  const parsed = JSON.parse(json);

  assert(parsed.name === '播客名称', '4.1 name字段');
  assert(parsed.slug === 'bo-ke-ming-cheng', '4.1 slug字段');
  assert(parsed.audioFile === '播客名称.mp3', '4.1 audioFile为原始文件名');
  assert(parsed.coverFile === '播客名称.png', '4.1 coverFile为原始文件名');
  assert(parsed.scriptFile === '播客名称.md', '4.1 scriptFile为原始文件名');
  assert(typeof parsed.audioSize === 'number', '4.1 audioSize为number类型');
  assert(parsed.audioSize === 12345678, '4.1 audioSize值正确');
}

// 4.2 ContentTypes.podcast.items 为数组
{
  const ct = {
    article: true as const,
    podcast: {
      items: [
        { name: 'Ep1', slug: 'ep1', audioFile: 'Ep1.mp3', audioSize: 1000 },
        { name: 'Ep2', slug: 'ep2', audioFile: 'Ep2.mp3', audioSize: 2000 },
      ],
    },
  };
  const json = JSON.stringify(ct);
  const parsed = JSON.parse(json);

  assert(Array.isArray(parsed.podcast.items), '4.2 items为数组');
  assert(parsed.podcast.items.length === 2, '4.2 items有2个元素');
  assert(parsed.podcast.items[0].audioFile === 'Ep1.mp3', '4.2 items[0].audioFile为原始文件名(非URL)');
}

// 4.3 ArticleMeta 完整结构
{
  const meta: ArticleMeta = {
    slug: 'test-article',
    title: '测试文章',
    category: { name: 'AI', slug: 'ai' },
    publishedAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
    readingTime: 5,
    feishuDocToken: 'doc123',
    contentTypes: {
      article: true,
      podcast: {
        items: [{
          name: '深度访谈',
          slug: 'shen-du-fang-tan',
          audioFile: '深度访谈.mp3',
          coverFile: '深度访谈.png',
          scriptFile: '深度访谈.md',
          audioSize: 50000000,
        }],
      },
    },
    contentType: 'podcast',
  };
  const json = JSON.stringify(meta);
  const parsed = JSON.parse(json);

  assert(parsed.contentTypes.podcast !== undefined, '4.3 podcast字段存在');
  assert(Array.isArray(parsed.contentTypes.podcast.items), '4.3 items为数组');
  assert(parsed.contentTypes.podcast.items[0].name === '深度访谈', '4.3 播客名称');
}

// 4.4 无覆盖字段的播客（coverFile/scriptFile 为 undefined 时不输出）
{
  const item: PodcastItemMeta = { name: 'Solo', slug: 'solo', audioFile: 'Solo.mp3', audioSize: 1000 };
  const json = JSON.stringify(item);
  assert(!json.includes('coverFile'), '4.4 无coverFile时不包含该键');
  assert(!json.includes('scriptFile'), '4.4 无scriptFile时不包含该键');
}

// ─── 结果汇总 ───
console.log(`\n═══════════════════════════════`);
console.log(`  通过: ${passed}  失败: ${failed}`);
console.log(`═══════════════════════════════\n`);

if (failed > 0) process.exit(1);
