/**
 * blog-data.ts 单元测试 — resolvePodcastUrls URL 解析
 *
 * 真 import 被测模块（此前为复制实现独立测试，存在漂移失效风险）：
 * resolvePodcastUrls 现位于纯函数模块 blog-data-utils.ts（不依赖 markdown 管线），
 * 先固定 R2_PUBLIC_URL 再动态 import，断言 URL 前缀完全确定。
 *
 * 运行: npx tsx lib/__tests__/blog-data.test.ts
 */

// 固定测试用 R2 基址，断言前缀确定（须在 import blog-data-utils 前设置）
const R2_BASE = 'https://test-r2.local';
process.env.R2_PUBLIC_URL = R2_BASE;

async function main() {
const { resolvePodcastUrls } = await import('../blog-data-utils');

// ─── 测试工具 ───

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

// ══════════════════════════════════════════════
// resolvePodcastUrls() URL 解析
// ══════════════════════════════════════════════

console.log('\n── resolvePodcastUrls() ──');

// 1 正常拼接
{
  const items = [
    { name: '测试', slug: 'test', audioFile: 'foo.mp3', audioSize: 1024 },
  ];
  const result = resolvePodcastUrls('ai', 'test-article', items);
  assert(result.length === 1, '1 返回1个item');
  assert(
    result[0].audioFile === `${R2_BASE}/blog-data/articles/ai/test-article/podcast/foo.mp3`,
    '1 audioFile为完整R2 URL',
  );
  assert(result[0].slug === 'test', '1 slug保持不变');
  assert(result[0].audioSize === 1024, '1 audioSize原样输出');
}

// 2 空数组 / undefined
{
  assert(resolvePodcastUrls('ai', 'test', []).length === 0, '2 空数组返回空数组');
  assert(resolvePodcastUrls('ai', 'test', undefined).length === 0, '2 undefined返回空数组');
}

// 3 缺失字段 (coverFile/scriptFile = undefined)
{
  const result = resolvePodcastUrls('tech', 'solo-ep', [
    { name: 'Solo', slug: 'solo', audioFile: 'solo.mp3' },
  ]);
  assert(result[0].coverFile === undefined, '3 coverFile为undefined');
  assert(result[0].scriptFile === undefined, '3 scriptFile为undefined');
}

// 4 多 item 各字段
{
  const result = resolvePodcastUrls('ai', 'multi-ep', [
    { name: 'Ep1', slug: 'ep1', audioFile: 'Ep1.mp3', coverFile: 'Ep1.png' },
    { name: 'Ep2', slug: 'ep2', audioFile: 'Ep2.mp3', scriptFile: 'Ep2.md' },
    { name: 'Ep3', slug: 'ep3', audioFile: 'Ep3.mp3' },
  ]);
  assert(result.length === 3, '4 3个item全部返回');
  assert(result[0].audioFile === `${R2_BASE}/blog-data/articles/ai/multi-ep/podcast/Ep1.mp3`, '4 Ep1 audioFile正确');
  assert(result[0].coverFile === `${R2_BASE}/blog-data/articles/ai/multi-ep/podcast/Ep1.png`, '4 Ep1 coverFile正确');
  assert(result[1].scriptFile === `${R2_BASE}/blog-data/articles/ai/multi-ep/podcast/Ep2.md`, '4 Ep2 scriptFile正确');
  assert(result[2].coverFile === undefined, '4 Ep3 无coverFile');
}

// 5 中文文件名完整拼接
{
  const result = resolvePodcastUrls('ai', 'full-ep', [{
    name: '完整播客',
    slug: 'full',
    audioFile: '完整播客.mp3',
    coverFile: '完整播客.png',
    scriptFile: '完整播客.md',
    audioSize: 999,
  }]);
  const base = `${R2_BASE}/blog-data/articles/ai/full-ep/podcast`;
  assert(result[0].audioFile === `${base}/完整播客.mp3`, '5 audioFile完整URL');
  assert(result[0].coverFile === `${base}/完整播客.png`, '5 coverFile完整URL');
  assert(result[0].scriptFile === `${base}/完整播客.md`, '5 scriptFile完整URL');
}

// ─── 结果汇总 ───
console.log(`\n═══════════════════════════════`);
console.log(`  通过: ${passed}  失败: ${failed}`);
console.log(`═══════════════════════════════\n`);

if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
