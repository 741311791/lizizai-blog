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

/**
 * 文本对齐包装器
 * 飞书 align: 1=左对齐(默认), 2=居中, 3=右对齐
 */
function wrapAlignment(text: string, align?: number): string {
  if (align === 2) {
    return `<div style="text-align:center">\n\n${text}\n\n</div>`;
  }
  if (align === 3) {
    return `<div style="text-align:right">\n\n${text}\n\n</div>`;
  }
  return text;
}

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
 * 飞书 API 返回的元素格式:
 *   - text_run: { text_run: { content: string, text_element_style: {...} } }
 *   - equation: { equation: { content: string } }  (KaTeX 语法)
 */
function parseTextElements(elements: any[]): string {
  return elements.map(el => {
    // 处理公式元素（飞书 inline equation，KaTeX 语法）
    if (el.equation) {
      return `$${el.equation.content}$`;
    }

    // 兼容两种格式：text_run.content 和 el.text
    let text = el.text_run?.content || el.text || '';
    const style = el.text_run?.text_element_style || el.style || {};

    if (style.inline_code) return `\`${text}\``;
    if (style.link) text = `[${text}](${style.link.url})`;
    if (style.bold) text = `**${text}**`;
    if (style.italic) text = `*${text}*`;
    if (style.strikethrough) text = `~~${text}~~`;
    if (style.underline) text = `<u>${text}</u>`;

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

  let lastBlockType = -1;

  function processBlock(block: FeishuBlock, depth: number = 0): void {
    if (block.block_type === 1) {
      const children = block.children || [];
      for (const childId of children) {
        const child = blockMap.get(childId);
        if (child) processBlock(child, depth);
      }
      return;
    }

    // 列表/引用结束后接不同类型块，插入空行确保 Markdown 正确分段
    const isListBlock = block.block_type === 12 || block.block_type === 13;
    const lastIsList = lastBlockType === 12 || lastBlockType === 13;
    const isQuoteBlock = block.block_type === 15;
    const lastIsQuote = lastBlockType === 15;
    if ((lastIsList && !isListBlock) || (lastIsQuote && !isQuoteBlock)) {
      if (depth === 0) lines.push('');
    }

    let content = '';

    switch (block.block_type) {
      case 2: {
        content = extractTextContent(block);
        if (content) {
          // 处理独立公式块（仅含 equation 元素）
          const textData = block.text;
          const elements = textData?.elements || [];
          const isEquationOnly = elements.length === 1 && elements[0].equation;
          if (isEquationOnly) {
            lines.push(`$$\n${elements[0].equation.content}\n$$\n`);
          } else {
            const wrapped = wrapAlignment(content, textData?.style?.align);
            lines.push(wrapped + '\n');
          }
        }
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
        if (content) {
          const textData = block.text || block.heading1 || block.heading2 || block.heading3 ||
                           block.heading4 || block.heading5 || block.heading6;
          const wrapped = wrapAlignment(prefix + content, textData?.style?.align);
          lines.push(wrapped + '\n');
        }
        break;
      }

      case 12: {
        content = extractTextContent(block);
        const indent12 = '  '.repeat(depth);
        if (content) lines.push(indent12 + '- ' + content);
        const children = block.children || [];
        for (const childId of children) {
          const child = blockMap.get(childId);
          if (child) processBlock(child, depth + 1);
        }
        break;
      }

      case 13: {
        content = extractTextContent(block);
        const indent13 = '  '.repeat(depth);
        if (content) lines.push(indent13 + '1. ' + content);
        // 处理有序列表的子级（嵌套列表项）
        const children13 = block.children || [];
        for (const childId of children13) {
          const child = blockMap.get(childId);
          if (child) processBlock(child, depth + 1);
        }
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

        // Mermaid 图表检测：飞书无专用枚举，通过内容首行关键字判断
        const codeLines = codeContent.split('\n');
        const firstLine = codeLines[0]?.trim() || '';
        const mermaidKeywords = [
          'graph ', 'graph\t', 'sequenceDiagram', 'flowchart ',
          'classDiagram', 'gantt', 'pie ', 'erDiagram', 'journey',
          'stateDiagram', 'gitGraph', 'mindmap', 'timeline',
        ];
        if (mermaidKeywords.some(k => firstLine.startsWith(k) || firstLine === k.trim())) {
          langStr = 'mermaid';
        }

        lines.push('```' + langStr);
        lines.push(codeContent);
        lines.push('```\n');
        break;
      }

      case 15: {
        // 引用块：递归处理自身及所有子块，统一加 > 前缀
        const processQuotedBlock = (b: FeishuBlock): void => {
          const c = extractTextContent(b);
          if (c) {
            const quoted = c.split('\n').map((l: string) => '> ' + l).join('\n');
            lines.push(quoted);
          }
          // 处理引用块内的图片
          if (b.block_type === 27) {
            const img = b.image;
            if (img?.token) {
              imageCounter++;
              const ext = img.mime_type?.includes('png') ? 'png' : 'jpg';
              const filename = `img-${String(imageCounter).padStart(3, '0')}.${ext}`;
              images.push({
                token: img.token,
                filename,
                alt: img.caption?.elements?.map((e: any) => e.text).join('') || '',
              });
              lines.push('> ' + `![${filename}](${imageBaseUrl}/${filename})`);
            }
          }
          const children = b.children || [];
          for (const childId of children) {
            const child = blockMap.get(childId);
            if (child) processQuotedBlock(child);
          }
        };
        processQuotedBlock(block);
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
        const calloutData = block.callout;
        const emoji = calloutData?.emoji_id || '💡';
        content = extractTextContent(block);
        if (content) lines.push(`> ${emoji} ${content}\n`);
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
        const tableData = block.table;
        const property = tableData?.property;
        if (!tableData || !property) {
          lines.push('<!-- table: missing data -->\n');
          break;
        }

        const rowSize = property.row_size || 0;
        const colSize = property.column_size || 0;
        const hasHeader = property.header_row !== false;

        // table.cells 是 table_cell 块的 block_id 数组
        // 需要查找每个 table_cell 块并提取其子文本块内容
        const cellIds = tableData.cells || [];
        const cellContents: string[][] = [];

        for (let r = 0; r < rowSize; r++) {
          const row: string[] = [];
          for (let c = 0; c < colSize; c++) {
            const cellIndex = r * colSize + c;
            const cellId = cellIds[cellIndex];
            let cellText = '';

            if (cellId) {
              const cellBlock = blockMap.get(cellId);
              if (cellBlock) {
                // table_cell 的子块是 Text 块
                const childIds = cellBlock.children || [];
                const texts: string[] = [];
                for (const childId of childIds) {
                  const child = blockMap.get(childId);
                  if (child) {
                    const t = extractTextContent(child);
                    if (t) texts.push(t);
                  }
                }
                cellText = texts.join(' ');
              }
            }
            row.push(cellText.replace(/\|/g, '\\|'));
          }
          cellContents.push(row);
        }

        if (cellContents.length > 0 && colSize > 0) {
          const tableLines: string[] = [];

          // 表头行
          tableLines.push('| ' + cellContents[0].join(' | ') + ' |');

          // 分隔行
          if (hasHeader) {
            tableLines.push('| ' + cellContents[0].map(() => '---').join(' | ') + ' |');
          }

          // 数据行
          const startRow = hasHeader ? 1 : 0;
          for (let r = startRow; r < cellContents.length; r++) {
            tableLines.push('| ' + cellContents[r].join(' | ') + ' |');
          }

          // 如果没有 header 但需要补齐分隔行
          if (!hasHeader && cellContents.length > 0) {
            // 无表头时，在首行前插入分隔行
            const sepLine = '| ' + cellContents[0].map(() => '---').join(' | ') + ' |';
            tableLines.splice(1, 0, sepLine);
          }

          lines.push(tableLines.join('\n') + '\n');
        }
        break;
      }
    }

    lastBlockType = block.block_type;

    // 表格块 (31)、表格单元格 (32)、引用块 (15) 已在内部处理子块，跳过通用递归
    if (block.block_type !== 12 && block.block_type !== 13 && block.block_type !== 15 && block.block_type !== 31 && block.block_type !== 32) {
      const children = block.children || [];
      for (const childId of children) {
        const child = blockMap.get(childId);
        if (child) processBlock(child, depth);
      }
    }
  }

  processBlock(rootBlock);

  // 合并连续空行为单个空行，同时修复表格行间的多余空行
  const rawMarkdown = lines.join('\n');
  const markdown = rawMarkdown
    .replace(/\n{3,}/g, '\n\n')  // 最多保留一个空行
    .replace(/(\|[^\n]+)\n\n(\|)/g, '$1\n$2')  // 表格行之间不能有空行
    .trim();

  return {
    markdown,
    images,
    frontmatter,
  };
}
