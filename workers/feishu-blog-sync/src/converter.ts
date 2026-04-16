/**
 * 飞书文档块 → Markdown 转换器
 */

import type { FeishuBlock } from './feishu';

export interface ImageInfo {
  token: string;
  filename: string;
  alt?: string;
}

export interface ConvertResult {
  markdown: string;
  images: ImageInfo[];
  frontmatter?: Record<string, any>;
}

// 块类型映射
const BLOCK_TYPE_MAP: Record<number, string> = {
  1: 'page',
  2: 'text',
  3: 'heading1',
  4: 'heading2',
  5: 'heading3',
  6: 'heading4',
  7: 'heading5',
  8: 'heading6',
  9: 'heading7',
  10: 'heading8',
  11: 'heading9',
  12: 'bullet',
  13: 'ordered',
  14: 'code',
  15: 'quote',
  17: 'todo',
  19: 'callout',
  22: 'divider',
  27: 'image',
  31: 'table',
};

// 标题前缀
const HEADING_PREFIX: Record<number, string> = {
  3: '# ',
  4: '## ',
  5: '### ',
  6: '#### ',
  7: '##### ',
  8: '###### ',
  9: '####### ',
  10: '######## ',
  11: '######### ',
};

interface TextElement {
  text: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    inline_code?: boolean;
    link?: { url: string };
  };
}

/**
 * 解析文本元素为 Markdown
 * 飞书 API 返回的元素格式: { text_run: { content: string, text_element_style: {...} } }
 */
function parseTextElements(elements: any[]): string {
  return elements.map(el => {
    // 兼容两种格式：text_run.content 和 el.text
    let text = el.text_run?.content || el.text || '';
    const style = el.text_run?.text_element_style || el.style || {};

    if (style.inline_code) return `\`${text}\``;
    if (style.link) text = `[${text}](${style.link.url})`;
    if (style.bold) text = `**${text}**`;
    if (style.italic) text = `*${text}*`;
    if (style.strikethrough) text = `~~${text}~~`;

    return text;
  }).join('');
}

/**
 * 从文本块中提取内容
 */
function extractTextContent(block: FeishuBlock): string {
  const text = block.text || block.heading1 || block.heading2 || block.heading3 ||
               block.heading4 || block.heading5 || block.heading6 ||
               block.bullet || block.ordered || block.quote || block.callout;

  if (!text?.elements) return '';
  return parseTextElements(text.elements);
}

/**
 * 检查是否是 frontmatter 代码块（YAML 格式）
 * 注意：飞书 API 中 language 是数字枚举值，YAML = 67
 */
function isFrontmatterBlock(block: FeishuBlock): boolean {
  if (block.block_type !== 14) return false;
  const code = block.code;
  // language 是数字枚举值：67 = YAML
  // 也检查 style.language 以兼容可能的字符串格式
  const lang = code?.style?.language || code?.language;
  if (typeof lang === 'number') {
    return lang === 67; // YAML
  }
  if (typeof lang === 'string') {
    return lang.toLowerCase() === 'yaml' || lang.toLowerCase() === 'yml';
  }
  return false;
}

/**
 * 解析 frontmatter
 */
function parseFrontmatter(content: string): Record<string, any> | undefined {
  try {
    const result: Record<string, any> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        if (value.startsWith('[') && value.endsWith(']')) {
          result[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          result[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  } catch {
    return null;
  }
}

/**
 * 转换 blocks 为 Markdown
 */
export function convertBlocksToMarkdown(
  blocks: FeishuBlock[],
  imageBaseUrl: string
): ConvertResult {
  const images: ImageInfo[] = [];
  let imageCounter = 0;
  let hasFrontmatter = false;
  let frontmatter: Record<string, any> | undefined;
  const lines: string[] = [];

  const blockMap = new Map(blocks.map(b => [b.block_id, b]));
  const rootBlock = blocks.find(b => b.block_type === 1);
  if (!rootBlock) {
    return { markdown: '', images: [] };
  }

  function processBlock(block: FeishuBlock, depth: number = 0): void {
    if (block.block_type === 1) {
      const children = block.children || [];
      for (const childId of children) {
        const child = blockMap.get(childId);
        if (child) processBlock(child, depth);
      }
      return;
    }

    let content = '';

    switch (block.block_type) {
      case 2: {
        content = extractTextContent(block);
        if (content) lines.push(content + '\n');
        break;
      }

      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11: {
        const prefix = HEADING_PREFIX[block.block_type] || '# ';
        content = extractTextContent(block);
        if (content) lines.push(prefix + content + '\n');
        break;
      }

      case 12: {
        content = extractTextContent(block);
        if (content) lines.push('- ' + content);
        const children = block.children || [];
        for (const childId of children) {
          const child = blockMap.get(childId);
          if (child) processBlock(child, depth + 1);
        }
        break;
      }

      case 13: {
        content = extractTextContent(block);
        if (content) lines.push('1. ' + content);
        break;
      }

      case 14: {
        const code = block.code;
        // language 在 style.language（数字枚举值）
        const lang = code?.style?.language || code?.language || '';
        // 代码块内容在 elements 中，每个 element 有 text_run.content
        const codeContent = code?.elements?.map((e: any) => {
          return e.text_run?.content || e.text || '';
        }).join('') || '';

        if (isFrontmatterBlock(block) && !hasFrontmatter) {
          hasFrontmatter = true;
          frontmatter = parseFrontmatter(codeContent);
          return;
        }

        // 语言枚举值转字符串用于 Markdown
        let langStr = '';
        if (typeof lang === 'number') {
          // 常见语言枚举映射
          const langMap: Record<number, string> = {
            1: '', 30: 'javascript', 63: 'typescript', 49: 'python',
            29: 'java', 22: 'go', 53: 'rust', 52: 'ruby',
            56: 'sql', 67: 'yaml', 28: 'json', 39: 'markdown',
            24: 'html', 12: 'css', 55: 'scss', 7: 'bash',
            9: 'cpp', 10: 'c', 8: 'csharp', 61: 'swift',
            32: 'kotlin', 57: 'scala', 43: 'php', 44: 'perl',
            36: 'lua', 35: 'lisp', 58: 'scheme', 33: 'latex'
          };
          langStr = langMap[lang] || '';
        } else {
          langStr = String(lang);
        }

        lines.push('```' + langStr);
        lines.push(codeContent);
        lines.push('```\n');
        break;
      }

      case 15: {
        content = extractTextContent(block);
        if (content) {
          const quoted = content.split('\n').map(l => '> ' + l).join('\n');
          lines.push(quoted + '\n');
        }
        break;
      }

      case 17: {
        const todo = block.todo;
        const checked = todo?.checked ? 'x' : ' ';
        content = extractTextContent(block);
        if (content) lines.push(`- [${checked}] ${content}`);
        break;
      }

      case 19: {
        content = extractTextContent(block);
        if (content) lines.push(`> 💡 ${content}\n`);
        break;
      }

      case 22: {
        lines.push('---\n');
        break;
      }

      case 27: {
        const img = block.image;
        if (img?.token) {
          imageCounter++;
          const ext = img.mime_type?.includes('png') ? 'png' : 'jpg';
          const filename = `img-${String(imageCounter).padStart(3, '0')}.${ext}`;
          images.push({
            token: img.token,
            filename,
            alt: img.caption?.elements?.map((e: any) => e.text).join('') || '',
          });
          lines.push(`![${filename}](${imageBaseUrl}/${filename})\n`);
        }
        break;
      }

      case 31: {
        lines.push('<!-- table content -->\n');
        break;
      }
    }

    if (block.block_type !== 12 && block.block_type !== 13) {
      const children = block.children || [];
      for (const childId of children) {
        const child = blockMap.get(childId);
        if (child) processBlock(child, depth);
      }
    }
  }

  processBlock(rootBlock);

  return {
    markdown: lines.join('\n').trim(),
    images,
    frontmatter,
  };
}
