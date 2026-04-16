'use client';

import { useState, useEffect } from 'react';
import { Lock, RefreshCw, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 同步状态
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // 检查是否已登录（无副作用）
  useEffect(() => {
    fetch('/api/admin/auth')
      .then(res => res.json())
      .then(data => setAuthenticated(data.authenticated === true))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuthenticated(true);
      } else {
        setAuthError(data.error || '登录失败');
      }
    } catch {
      setAuthError('网络错误，请重试');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    // 清除 cookie
    document.cookie = 'admin_session=; path=/; max-age=0';
    setAuthenticated(false);
    setSyncResult(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setSyncResult({ success: true, message: data.message || '同步成功' });
      } else {
        setSyncResult({ success: false, message: data.error || '同步失败' });
      }
    } catch {
      setSyncResult({ success: false, message: '网络错误，请重试' });
    } finally {
      setSyncing(false);
    }
  };

  // 加载检查中
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // 未登录 - 密码输入
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">后台管理</CardTitle>
            <CardDescription>请输入管理密码</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="管理密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {authError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  {authError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? '验证中...' : '进入后台'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已登录 - 管理面板
  return (
    <div className="min-h-screen">
      {/* 顶部栏 */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-4xl px-4 flex h-14 items-center justify-between">
          <h1 className="text-lg font-bold">Zizai Blog Admin</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            退出
          </Button>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          {/* 文章同步卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                文章同步
              </CardTitle>
              <CardDescription>
                从飞书文档同步最新内容到博客，同步后页面将在 ISR 缓存过期后自动更新
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? '同步中...' : '同步飞书文档'}
              </Button>

              {/* 同步结果 */}
              {syncResult && (
                <div
                  className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                    syncResult.success
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span>{syncResult.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
