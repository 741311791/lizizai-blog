/**
 * AI 资讯标签视觉映射
 *
 * 为资讯卡片提供渐变色、图标、标签色的统一视觉方案。
 * 未映射的标签使用 general 兜底样式。
 */

import {
  Brain,
  Rocket,
  FlaskConical,
  TrendingUp,
  GitBranch,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';

/** 单个标签的视觉配置 */
export interface TagVisual {
  /** 渐变色（无封面图时的兜底背景） */
  gradient: string;
  /** 装饰图标 */
  icon: LucideIcon;
  /** 标签文字颜色（Tailwind class） */
  labelColor: string;
  /** 标签背景色（Tailwind class） */
  labelBg: string;
  /** 中文标签名 */
  label: string;
}

/** 已知标签的视觉映射表 */
const TAG_VISUAL_MAP: Record<string, TagVisual> = {
  'llm': {
    gradient: 'from-blue-700 to-indigo-800',
    icon: Brain,
    labelColor: 'text-blue-400',
    labelBg: 'bg-blue-500/15',
    label: '大模型',
  },
  'product': {
    gradient: 'from-emerald-700 to-teal-800',
    icon: Rocket,
    labelColor: 'text-green-400',
    labelBg: 'bg-green-500/15',
    label: '产品发布',
  },
  'research': {
    gradient: 'from-purple-700 to-violet-800',
    icon: FlaskConical,
    labelColor: 'text-purple-400',
    labelBg: 'bg-purple-500/15',
    label: '学术研究',
  },
  'industry': {
    gradient: 'from-amber-700 to-orange-800',
    icon: TrendingUp,
    labelColor: 'text-yellow-400',
    labelBg: 'bg-yellow-500/15',
    label: '行业动态',
  },
  'open-source': {
    gradient: 'from-orange-700 to-red-800',
    icon: GitBranch,
    labelColor: 'text-orange-400',
    labelBg: 'bg-orange-500/15',
    label: '开源项目',
  },
};

/** 通用兜底视觉配置 */
const FALLBACK_VISUAL: TagVisual = {
  gradient: 'from-slate-700 to-slate-800',
  icon: Newspaper,
  labelColor: 'text-gray-400',
  labelBg: 'bg-gray-500/15',
  label: '综合',
};

/**
 * 获取标签的视觉配置
 *
 * 已知标签返回对应配置，未知标签返回 general 兜底。
 */
export function getTagVisual(tag: string): TagVisual {
  return TAG_VISUAL_MAP[tag] ?? FALLBACK_VISUAL;
}

/**
 * 获取封面图兜底的视觉配置（取第一个标签，无标签则用 general）
 */
export function getCoverFallbackVisual(tags: string[]): TagVisual {
  const firstTag = tags.length > 0 ? tags[0] : '';
  return getTagVisual(firstTag);
}

/**
 * 获取所有已知标签列表（用于生成分类等 UI）
 */
export function getKnownTags(): string[] {
  return Object.keys(TAG_VISUAL_MAP);
}
