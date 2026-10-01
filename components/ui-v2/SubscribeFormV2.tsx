'use client';

/**
 * SubscribeFormV2 — 订阅表单（编辑风升级版，预览组件）
 * 输入框与按钮一体化（无缝拼接成单一胶囊容器），跳转逻辑同 SubstackEmbed form 形态
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SUBSTACK_URL } from '@/components/subscribe/SubstackEmbed';

interface SubscribeFormV2Props {
  buttonText: string;
  placeholder: string;
  emailLabel?: string;
  className?: string;
}

export default function SubscribeFormV2({
  buttonText,
  placeholder,
  emailLabel,
  className,
}: SubscribeFormV2Props) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = email.trim()
      ? `${SUBSTACK_URL}/subscribe?email=${encodeURIComponent(email.trim())}`
      : `${SUBSTACK_URL}/subscribe`;
    const win = window.open(target, '_blank', 'noopener,noreferrer');
    // 弹窗被拦截时兜底当前页跳转，保证转化入口不失效
    if (!win) {
      window.location.href = target;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-stretch overflow-hidden rounded-lg border border-border bg-background transition-colors focus-within:border-primary/60 ${className ?? ''}`}
    >
      <Input
        type="email"
        name="email"
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        aria-label={emailLabel ?? placeholder}
      />
      <Button
        type="submit"
        className="h-12 shrink-0 rounded-none border-0 bg-primary px-6 font-medium hover:bg-primary/90"
      >
        {buttonText}
      </Button>
    </form>
  );
}
