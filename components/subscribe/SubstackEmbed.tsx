'use client';

/**
 * Substack 订阅入口组件
 *
 * 两种形态：
 * - button（默认）：深色跳转按钮，最稳，保持博客设计一致性
 * - form：自定义深色邮箱框，提交跳转 Substack 完成订阅
 *
 * 设计决策见 docs/subscription-architecture.md §3
 * publication: https://lizizai.substack.com
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Substack publication 地址（订阅跳转目标） */
export const SUBSTACK_URL = 'https://lizizai.substack.com';

interface SubstackEmbedProps {
  variant?: 'button' | 'form';
  /** 按钮文案（button / form 形态） */
  buttonText?: string;
  /** 邮箱框占位符（form 形态） */
  placeholder?: string;
  /** 邮箱框可访问名称（form 形态，本地化文案） */
  emailLabel?: string;
  /** 外层容器类名 */
  className?: string;
}

export default function SubstackEmbed({
  variant = 'button',
  buttonText = 'Subscribe',
  placeholder = 'your@email.com',
  emailLabel,
  className,
}: SubstackEmbedProps) {
  const [email, setEmail] = useState('');

  // form 形态：自定义邮箱框 + 跳转 Substack 完成订阅
  if (variant === 'form') {
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
      <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
        <Input
          type="email"
          name="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-background h-11 rounded-lg"
          aria-label={emailLabel ?? placeholder}
        />
        <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 shrink-0 rounded-lg">
          {buttonText}
        </Button>
      </form>
    );
  }

  // button 形态（默认）：跳转按钮
  return (
    <Button asChild className={className}>
      <a href={SUBSTACK_URL} target="_blank" rel="noopener noreferrer">
        {buttonText}
      </a>
    </Button>
  );
}
