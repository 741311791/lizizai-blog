'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface AuthorCardProps {
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: string;
}

export default function AuthorCard({ author, publishedAt }: AuthorCardProps) {
  const initials = author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 py-6 border-y border-border">
      <Avatar className="h-12 w-12">
        <AvatarImage src={author.avatar} alt={author.name} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-semibold">{author.name}</div>
        <div className="text-sm text-muted-foreground">
          {format(new Date(publishedAt), 'MMM dd, yyyy')}
        </div>
      </div>
    </div>
  );
}
