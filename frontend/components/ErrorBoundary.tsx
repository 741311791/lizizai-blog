/**
 * React Error Boundary 组件
 *
 * 捕获渲染错误，防止整个应用崩溃，提供优雅的错误降级
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { config } from '@/lib/env';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到日志服务
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // 可选：发送到错误追踪服务（如 Sentry）
    // if (typeof window !== 'undefined' && config.isProduction) {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback 或默认错误 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * 默认错误显示组件
 */
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const isDevelopment = config.isDevelopment;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Please try again or contact support if the problem
            persists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm font-mono text-destructive mb-2">{error.message}</p>
              <pre className="text-xs overflow-auto max-h-40 text-muted-foreground">
                {error.stack}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onReset} variant="default">
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = '/')} variant="outline">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
