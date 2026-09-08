'use client';

/**
 * Substack 订阅入口组件
 *
 * 三种形态：
 * - button（默认）：深色跳转按钮，最稳，保持博客设计一致性
 * - form：自定义深色邮箱框，提交跳转 Substack 完成订阅
 * - iframe：官方 embed（白底，与深色模式冲突，仅备选）
 *
 * 设计决策见 docs/subscription-architecture.md §3
 * publication: https://lizizai.substack.com
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Substack publication 地址（订阅跳转目标） */
const SUBSTACK_URL = 'https://lizizai.substack.com';

interface SubstackEmbedProps {
  variant?: 'button' | 'form' | 'iframe';
  /** 按钮文案（button / form 形态） */
  buttonText?: string;
  /** 邮箱框占位符（form 形态） */
  placeholder?: string;
  /** 外层容器类名 */
  className?: string;
}

export default function SubstackEmbed({
  variant = 'button',
  buttonText = 'Subscribe',
  placeholder = 'your@email.com',
  className,
}: SubstackEmbedProps) {
  const [email, setEmail] = useState('');

  // iframe 形态：官方 embed（白底，仅备选）
  if (variant === 'iframe') {
    return (
      <iframe
        src={`${SUBSTACK_URL}/embed`}
        width="100%"
        height={180}
        style={{ border: '1px solid #EEE', background: 'white' }}
        frameBorder={0}
        scrolling="no"
        className={className}
        title="Substack"
      />
    );
  }

  // form 形态：自定义邮箱框 + 跳转 Substack 完成订阅
  if (variant === 'form') {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const target = email.trim()
        ? `${SUBSTACK_URL}/subscribe?email=${encodeURIComponent(email.trim())}`
        : `${SUBSTACK_URL}/subscribe`;
      window.open(target, '_blank', 'noopener,noreferrer');
    };

    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className ?? ''}`}>
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-background"
          aria-label="email"
        />
        <Button type="submit" className="bg-primary hover:bg-primary/90 shrink-0">
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
