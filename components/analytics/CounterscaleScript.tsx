'use client';

import Script from 'next/script';
import { config } from '@/lib/env';

/**
 * Counterscale 分析脚本
 *
 * 在 layout 中引入，自动追踪页面访问
 * 仅在配置了 URL 时启用
 */
export default function CounterscaleScript() {
  if (!config.counterscaleUrl) {
    return null;
  }

  return (
    <Script
      id="counterscale-script"
      src={`${config.counterscaleUrl}/tracker.js`}
      data-site-id={config.siteUrl}
      strategy="afterInteractive"
      defer
    />
  );
}
