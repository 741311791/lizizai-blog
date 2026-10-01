
/**
 * AuthorCardV2 — 文章作者/日期卡（编辑风升级版，预览组件）
 * 头像 + 名字 + mono 日期小标（ISO 式双语通用，与全站 mono 语言统一）
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AuthorCardV2Props {
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
}

export default function AuthorCardV2({
  author,
  publishedAt,
}: AuthorCardV2Props) {
  const initials = author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={author.avatar} alt={author.name} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-sm">{author.name}</span>
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          {new Date(publishedAt).toISOString().slice(0, 10)}
        </span>
      </div>
    </div>
  );
}
