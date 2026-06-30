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

/** 从 markdown 内容提取标题列表（含去重 ID），自动跳过围栏代码块内的 # 行 */
export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const counter = new Map<string, number>();
  let inFence = false;   // 是否处于围栏代码块内
  let fenceChar = '';    // 围栏字符（` 或 ~），用于配对开关

  for (const line of content.split('\n')) {
    // 检测围栏代码块边界（``` 或 ~~~，允许最多 3 空格缩进，后跟可选语言标记）
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      const ch = fence[1][0];
      if (!inFence) {
        inFence = true;
        fenceChar = ch;
      } else if (ch === fenceChar) {
        // 仅同类围栏关闭（``` 关闭 ```，~ 关闭 ~）
        inFence = false;
        fenceChar = '';
      }
      continue;
    }
    if (inFence) continue; // 代码块内的 # 注释/伪标题不纳入目录

    const m = line.match(/^(#{1,3})\s+(.+)$/);
    if (!m) continue;
    const text = m[2];
    const base = `heading-${headingSlug(text)}`;
    const count = counter.get(base) || 0;
    counter.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    headings.push({ id, text, level: m[1].length });
  }

  return headings;
}

/** 预计算 heading text → id 映射（供 ArticleContent 的 getHeadingId 使用） */
export function buildHeadingIdMap(content: string): Map<string, string> {
  return new Map(extractHeadings(content).map(h => [h.text, h.id]));
}
