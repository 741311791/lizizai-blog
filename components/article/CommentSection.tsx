'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Reply, Heart, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getOrCreateGuestIdentity, type GuestIdentity } from '@/lib/guest-identity';
import { config } from '@/lib/env';

// ============= 类型定义 =============

interface Comment {
  id: number;
  content: string;
  html_content: string;
  parent_id: number;
  created_at: string;
  hidden: number;
  likes: number;
  pinned: number;
  nickname: string;
  avatar_url: string;
}

interface CommentNode extends Comment {
  children: CommentNode[];
}

// ============= 工具函数 =============

/** 将平面评论列表组装为树形结构 */
function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  // 先创建所有节点
  for (const c of comments) {
    map.set(c.id, { ...c, children: [] });
  }

  // 组装父子关系
  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** 格式化时间为相对时间 */
function formatTime(dateStr: string, t: ReturnType<typeof useTranslations<'comment'>>): string {
  const date = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z'));
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;

  if (diff < 60) return t('justNow');
  if (diff < 3600) return t('minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('hoursAgo', { count: Math.floor(diff / 3600) });
  if (diff < 2592000) return t('daysAgo', { count: Math.floor(diff / 86400) });
  return date.toLocaleDateString('zh-CN');
}

const CF_COMMENT_URL = config.cfCommentUrl;

// ============= CommentItem 组件 =============

function CommentItem({
  comment,
  depth = 0,
  replyingTo,
  onReply,
  onSubmitReply,
  onCancelReply,
  replyContent,
  onReplyContentChange,
  submitting,
  guestIdentity,
  slug,
  t,
}: {
  comment: CommentNode;
  depth?: number;
  replyingTo: number | null;
  onReply: (id: number, nickname: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
  replyContent: string;
  onReplyContentChange: (val: string) => void;
  submitting: boolean;
  guestIdentity: GuestIdentity;
  slug: string;
  t: ReturnType<typeof useTranslations<'comment'>>;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const isReplying = replyingTo === comment.id;
  const maxDepth = 4;
  const displayName = comment.nickname || t('anonymous');
  const avatarUrl = comment.avatar_url || `https://api.dicebear.com/9.x/adventurer/svg?seed=${comment.id}`;

  const handleLike = async () => {
    if (liked) return;
    try {
      const res = await fetch(`${CF_COMMENT_URL}/area/${slug}/comment/${comment.id}/like`, { method: 'POST' });
      if (res.ok) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch {
      // 静默失败
    }
  };

  return (
    <div className={depth > 0 ? 'ml-6 md:ml-10' : ''}>
      <div className="flex gap-3 py-3">
        {/* 头像 */}
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-9 h-9 rounded-full flex-shrink-0 bg-muted"
          loading="lazy"
        />

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-primary">{displayName}</span>
            <span className="text-muted-foreground text-xs">{formatTime(comment.created_at, t)}</span>
            {comment.pinned === 1 && (
              <span className="text-xs text-amber-500">{t('pinned')}</span>
            )}
          </div>

          {/* 评论内容 */}
          <div className="mt-1 text-sm text-foreground/90 prose prose-sm prose-invert max-w-none
            prose-p:my-1 prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:text-primary prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
            prose-pre:bg-muted/30 prose-pre:border prose-pre:border-border/50">
            <ReactMarkdown>{comment.content}</ReactMarkdown>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <button
              onClick={() => onReply(comment.id, displayName)}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              {t('reply')}
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-red-500' : 'hover:text-red-400'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
              {likeCount > 0 && likeCount}
            </button>
          </div>

          {/* 内联回复输入框 */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder={t('replyTo', { name: displayName })}
                className="min-h-[80px] text-sm bg-muted/20"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={onSubmitReply}
                  disabled={submitting || !replyContent.trim()}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {submitting ? t('sending') : t('send')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelReply}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 递归渲染子回复 */}
      {comment.children.length > 0 && depth < maxDepth && (
        <div className="border-l border-border/30">
          {comment.children.map(child => (
            <CommentItem
              key={child.id}
              comment={child}
              depth={depth + 1}
              replyingTo={replyingTo}
              onReply={onReply}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              replyContent={replyContent}
              onReplyContentChange={onReplyContentChange}
              submitting={submitting}
              guestIdentity={guestIdentity}
              slug={slug}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============= 主组件 =============

interface CommentSectionProps {
  /** 文章 slug，用于匹配对应的评论区域 */
  slug: string;
}

export default function CommentSection({ slug }: CommentSectionProps) {
  const t = useTranslations('comment');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity | null>(null);

  // 回复状态
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyingToNickname, setReplyingToNickname] = useState('');
  const [replyContent, setReplyContent] = useState('');

  // 加载评论
  const fetchComments = useCallback(async () => {
    if (!CF_COMMENT_URL) return;
    try {
      const res = await fetch(`${CF_COMMENT_URL}/area/${slug}/comments`);
      if (res.ok) {
        const data = await res.json();
        const visible = (data as Comment[]).filter((c: Comment) => c.hidden !== 1);
        setComments(visible);
      }
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // 初始化
  useEffect(() => {
    setGuestIdentity(getOrCreateGuestIdentity());
    fetchComments();
  }, [fetchComments]);

  // 提交评论
  const handleSubmit = async () => {
    if (!content.trim() || !guestIdentity || submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('parent_id', '0');
      formData.append('nickname', guestIdentity.nickname);
      formData.append('avatar_url', guestIdentity.avatarUrl);

      await fetch(`${CF_COMMENT_URL}/area/${slug}/comment`, {
        method: 'POST',
        body: formData,
      });

      setContent('');
      await fetchComments();
    } catch {
      // 静默失败
    } finally {
      setSubmitting(false);
    }
  };

  // 回复评论
  const handleReply = (id: number, nickname: string) => {
    setReplyingTo(id);
    setReplyingToNickname(nickname);
    setReplyContent(`@${nickname} `);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !guestIdentity || !replyingTo || submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', replyContent.trim());
      formData.append('parent_id', String(replyingTo));
      formData.append('nickname', guestIdentity.nickname);
      formData.append('avatar_url', guestIdentity.avatarUrl);

      await fetch(`${CF_COMMENT_URL}/area/${slug}/comment`, {
        method: 'POST',
        body: formData,
      });

      setReplyingTo(null);
      setReplyContent('');
      setReplyingToNickname('');
      await fetchComments();
    } catch {
      // 静默失败
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
    setReplyingToNickname('');
  };

  const [showAll, setShowAll] = useState(false);

  if (!CF_COMMENT_URL) return null;

  const commentTree = buildCommentTree(comments);
  const commentCount = comments.length;

  // 默认只展示前 6 条点赞最多的第一层评论（不含回复）
  const sortedRoots = [...commentTree].sort((a, b) => {
    // 置顶评论始终在前
    if (a.pinned === 1 && b.pinned !== 1) return -1;
    if (a.pinned !== 1 && b.pinned === 1) return 1;
    return b.likes - a.likes;
  });
  const MAX_VISIBLE = 6;
  const visibleRoots = showAll ? sortedRoots : sortedRoots.slice(0, MAX_VISIBLE);
  const hasMore = sortedRoots.length > MAX_VISIBLE;

  return (
    <section className="mt-12 space-y-6">
      {/* 标题 */}
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        {commentCount > 0 ? t('titleWithCount', { count: commentCount }) : t('title')}
      </h2>

      {/* 评论列表 */}
      <div className="space-y-1">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">{t('loading')}</div>
        ) : commentTree.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {t('empty')}
          </div>
        ) : (
          <>
            {visibleRoots.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replyingTo={replyingTo}
                onReply={handleReply}
                onSubmitReply={handleSubmitReply}
                onCancelReply={handleCancelReply}
                replyContent={replyContent}
                onReplyContentChange={setReplyContent}
                submitting={submitting}
                guestIdentity={guestIdentity!}
                slug={slug}
                t={t}
              />
            ))}
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t('viewAll', { count: sortedRoots.length })}
              </button>
            )}
            {showAll && hasMore && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full py-3 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t('collapse')}
              </button>
            )}
          </>
        )}
      </div>

      {/* 评论输入框 */}
      {guestIdentity && (
        <div className="space-y-3 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <img
              src={guestIdentity.avatarUrl}
              alt={guestIdentity.nickname}
              className="w-6 h-6 rounded-full bg-muted"
            />
            <span>{t('identity')}<strong className="text-primary">{guestIdentity.nickname}</strong></span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('placeholder')}
            className="min-h-[100px] text-sm"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
            >
              <Send className="w-4 h-4 mr-1.5" />
              {submitting ? t('submitting') : t('submit')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
