'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { type Heading } from '@/lib/utils/heading';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Article } from '@/types/index';
import SidebarStats from './SidebarStats';

interface ArticleSidebarProps {
  article: Article;
  // markdown 模式：服务端预提取的标题目录（HTML 模式的目录已由内容自带）
  headings?: Heading[];
  /** 内容类型标记：切换后正文标题 DOM 重建，observer 需重挂 */
  contentKey?: string;
}

/** 将扁平标题列表组织为树形结构（h2 为父节点，h3 为子节点） */
interface HeadingGroup {
  heading: Heading;
  index: number;
  children: Heading[];
}

function groupHeadings(headings: Heading[]): HeadingGroup[] {
  const groups: HeadingGroup[] = [];
  let currentGroup: HeadingGroup | null = null;

  headings.forEach((h) => {
    if (h.level <= 2) {
      // h1 或 h2 作为顶级节点
      currentGroup = { heading: h, index: 0, children: [] };
      groups.push(currentGroup);
    } else if (currentGroup) {
      // h3 归入最近的 h2 组
      currentGroup.children.push(h);
    }
  });

  // 编号：仅按顶级节点顺序
  groups.forEach((g, i) => {
    g.index = i + 1;
  });

  return groups;
}

/**
 * 文章模式侧边栏
 * ContentTypeSwitcher + 可展开 TOC + 阅读数据 + 标签
 */
export default function ArticleSidebar({
  article,
  headings,
  contentKey,
}: ArticleSidebarProps) {
  const t = useTranslations('article');
  const [activeId, setActiveId] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const groups = useMemo(() => groupHeadings(headings ?? []), [headings]);

  // 滚动监听：IntersectionObserver 追踪当前可见标题。
  // 观察范围限定在正文容器内，避免误捕相关文章/评论区的标题；
  // 依赖 contentKey：内容类型切换后正文 DOM 重建，observer 重新挂载。
  useEffect(() => {
    const container = document.querySelector('.article-content');
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    container.querySelectorAll('h2, h3').forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [contentKey]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, headingId: string) => {
    e.preventDefault();
    const element = document.getElementById(headingId);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(headingId);
    }
  };

  /** 点击一级标题：展开/收起子标题 */
  const toggleExpand = (groupId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-7">
      {/* 目录 */}
      {groups.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('toc')}
          </div>
          <nav>
            {groups.map((group) => {
              const isExpanded = expandedIds.has(group.heading.id);
              const hasChildren = group.children.length > 0;

              return (
                <div key={group.heading.id}>
                  {/* 一级标题 */}
                  <div
                    className={cn(
                      'flex items-center gap-2 py-1.5 text-sm transition-colors',
                      activeId === group.heading.id
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-xs tabular-nums min-w-[20px] text-muted-foreground">
                      {String(group.index).padStart(2, '0')}
                    </span>
                    <a
                      href={`#${group.heading.id}`}
                      onClick={(e) => handleClick(e, group.heading.id)}
                      className="flex-1 truncate"
                    >
                      {group.heading.text}
                    </a>
                    {hasChildren && (
                      <button
                        onClick={() => toggleExpand(group.heading.id)}
                        className="p-2.5 -m-2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={isExpanded ? t('tocCollapse') : t('tocExpand')}
                      >
                        <ChevronRight
                          className={cn(
                            'size-3.5 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* 二级标题（展开时显示） */}
                  {hasChildren && isExpanded && (
                    <div className="ml-7">
                      {group.children.map((child, childIdx) => (
                        <a
                          key={child.id}
                          href={`#${child.id}`}
                          onClick={(e) => handleClick(e, child.id)}
                          className={cn(
                            'flex items-center gap-2 py-1 text-sm transition-colors',
                            activeId === child.id
                              ? 'text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <span className="text-xs tabular-nums min-w-[20px] text-muted-foreground">
                            {String(childIdx + 1).padStart(2, '0')}
                          </span>
                          {child.text}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      )}

      {/* 阅读数据 + 标签（客户端拉取真实浏览/点赞） */}
      <SidebarStats article={article} />

      {/* 标签 */}
      {article.tags && article.tags.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('tagsLabel')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map(tag => (
              <span
                key={tag.slug}
                className="px-2.5 py-0.5 bg-card border border-border rounded-full text-xs text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
