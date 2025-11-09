/**
 * 自定义 Rehype Highlight 插件
 * 使用优化后的 Highlight.js 配置，减少包体积
 */

import { visit } from 'unist-util-visit';
import hljs from './highlight-config';

export default function rehypeHighlightCustom() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      // 只处理 <code> 标签
      if (node.tagName !== 'code') {
        return;
      }

      // 获取语言信息
      const className = node.properties?.className || [];
      const languageClass = className.find((c: string) => c.startsWith('language-'));

      if (!languageClass) {
        return;
      }

      // 提取语言名称
      const language = languageClass.replace('language-', '');

      // 获取代码内容
      const codeNode = node.children?.[0];
      if (!codeNode || codeNode.type !== 'text') {
        return;
      }

      const code = codeNode.value;

      try {
        // 使用自定义的 hljs 进行高亮
        const result = hljs.listLanguages().includes(language)
          ? hljs.highlight(code, { language })
          : hljs.highlightAuto(code);

        // 更新节点
        node.properties.className = [
          ...(node.properties.className || []),
          'hljs',
        ];

        // 将高亮后的 HTML 插入
        node.children = [
          {
            type: 'raw',
            value: result.value,
          },
        ];
      } catch (error) {
        console.error('Highlight.js error:', error);
        // 出错时保持原样
      }
    });
  };
}
