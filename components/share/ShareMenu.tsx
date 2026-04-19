'use client';

import {
  Link as LinkIcon,
  Code,
  BookmarkIcon,
  Facebook,
  Linkedin,
  Send,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Bluesky 图标组件
function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.038.416-.054-2.36.136-3.137 1.823-2.61 3.18 1.575 4.066 5.065 7.264 6.141 7.264s4.566-3.198 6.141-7.264c.527-1.357-.25-3.044-2.61-3.18.14.016.28.034.416.054 2.67.296 5.568-.628 6.383-3.364.246-.829.624-5.79.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/>
    </svg>
  );
}

// X (Twitter) 图标组件
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

interface ShareMenuProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  url: string;
  onShare?: () => void;
}

export default function ShareMenu({
  children,
  title,
  description,
  url,
  onShare,
}: ShareMenuProps) {
  const t = useTranslations('share');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied'));
      onShare?.();
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error(t('copyFailed'));
    }
  };

  const handleSendAsMessage = () => {
    // 使用系统分享 API
    if (navigator.share) {
      navigator.share({
        title,
        text: description,
        url,
      }).then(() => {
        onShare?.();
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      });
    } else {
      // 降级方案：复制链接
      handleCopyLink();
    }
  };

  const handleCopyEmbed = async () => {
    const embedCode = `<iframe src="${url}" width="100%" height="400" frameborder="0"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success(t('embedCopied'));
      onShare?.();
    } catch (error) {
      console.error('Failed to copy embed code:', error);
      toast.error(t('copyFailed'));
    }
  };

  const shareToNotes = () => {
    const notesUrl = `notes://new?text=${encodeURIComponent(title)}\n${url}`;
    window.open(notesUrl, '_blank');
    onShare?.();
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    onShare?.();
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    onShare?.();
  };

  const shareToBluesky = () => {
    const text = `${title}${description ? '\n' + description : ''}`;
    const blueskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(text + '\n' + url)}`;
    window.open(blueskyUrl, '_blank', 'width=600,height=600');
    onShare?.();
  };

  const shareToX = () => {
    const text = `${title}${description ? '\n' + description : ''}`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(xUrl, '_blank', 'width=600,height=400');
    onShare?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink}>
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>{t('copyLink')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSendAsMessage}>
          <Send className="mr-2 h-4 w-4" />
          <span>{t('sendAsMessage')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyEmbed}>
          <Code className="mr-2 h-4 w-4" />
          <span>{t('embed')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToNotes}>
          <BookmarkIcon className="mr-2 h-4 w-4" />
          <span>{t('shareToNotes')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook}>
          <Facebook className="mr-2 h-4 w-4" />
          <span>{t('shareToFacebook')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToLinkedIn}>
          <Linkedin className="mr-2 h-4 w-4" />
          <span>{t('shareToLinkedin')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToBluesky}>
          <BlueskyIcon className="mr-2 h-4 w-4" />
          <span>{t('shareToBluesky')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToX}>
          <XIcon className="mr-2 h-4 w-4" />
          <span>{t('shareToX')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
