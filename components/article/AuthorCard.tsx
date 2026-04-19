'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocale } from 'next-intl';

interface AuthorCardProps {
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
}

export default function AuthorCard({ author, publishedAt }: AuthorCardProps) {
  const locale = useLocale();
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
        <span className="text-xs text-muted-foreground">
          {new Date(publishedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}
