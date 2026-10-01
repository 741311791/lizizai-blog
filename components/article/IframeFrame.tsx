/**
 * 沙箱 iframe 统一封装：固化 sandbox 安全策略与无边框样式
 * （HtmlViewer / SlideViewer 共用；高度同步、加载策略等差异由调用方透传）
 * 修改 sandbox 白名单时只改此处，避免多处漂移
 */
import { cn } from '@/lib/utils';

interface IframeFrameProps extends React.ComponentProps<'iframe'> {
  /** 必填：可访问性标题 */
  title: string;
}

export function IframeFrame({ title, className, ...rest }: IframeFrameProps) {
  return (
    <iframe
      title={title}
      sandbox="allow-scripts"
      className={cn('border-0', className)}
      {...rest}
    />
  );
}
