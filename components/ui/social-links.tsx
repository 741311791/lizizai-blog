import { Twitter, Youtube, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOCIALS = [
  { href: 'https://twitter.com/zizaiblog', Icon: Twitter, label: 'Twitter' },
  { href: 'https://youtube.com/@zizaili', Icon: Youtube, label: 'YouTube' },
  { href: 'https://www.linkedin.com/in/zizai-li', Icon: Linkedin, label: 'LinkedIn' },
] as const;

interface SocialLinksProps {
  iconSize?: number;
  className?: string;
}

export default function SocialLinks({ iconSize = 18, className }: SocialLinksProps) {
  return (
    <div className={cn('flex justify-center gap-4', className)}>
      {SOCIALS.map(({ href, Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label={label}
        >
          <Icon size={iconSize} />
        </a>
      ))}
    </div>
  );
}
