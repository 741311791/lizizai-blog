/**
 * 标题 ID 生成工具
 *
 * 从 markdown 内容中提取标题并生成唯一、确定性的 ID。
 * 供 ArticleContent 和 TableOfContents 共享，确保两者生成一致的 ID。
 */

/** 标题 slug 化（支持中英文） */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

/** 从 markdown 内容提取标题列表（含去重 ID） */
export function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const matches = Array.from(content.matchAll(headingRegex));
  const counter = new Map<string, number>();

  return matches.map((match) => {
    const text = match[2];
    const base = `heading-${headingSlug(text)}`;
    const count = counter.get(base) || 0;
    counter.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    return { id, text, level: match[1].length };
  });
}

/** 预计算 heading text → id 映射（供 ArticleContent 的 getHeadingId 使用） */
export function buildHeadingIdMap(content: string): Map<string, string> {
  return new Map(extractHeadings(content).map(h => [h.text, h.id]));
}
