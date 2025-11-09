/**
 * GraphQL 错误处理链接
 *
 * 提供全局 GraphQL 错误处理机制，防止错误导致页面崩溃
 */

import { onError } from '@apollo/client/link/error';

export const errorLink = onError((error: any) => {
  const { graphQLErrors, networkError, operation } = error;
  // GraphQL 错误处理
  if (graphQLErrors) {
    graphQLErrors.forEach((err: any) => {
      const { message, locations, path, extensions } = err;
      console.error(
        `[GraphQL Error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
      );

      // 根据错误类型进行不同处理
      if (extensions?.code === 'UNAUTHENTICATED') {
        console.warn('User is not authenticated');
        // 可以重定向到登录页或刷新 token
      }

      if (extensions?.code === 'FORBIDDEN') {
        console.warn('Access forbidden');
        // 显示权限错误提示
      }

      if (extensions?.code === 'NOT_FOUND') {
        console.warn('Resource not found');
      }
    });

    // 在浏览器环境显示用户友好的错误消息
    if (typeof window !== 'undefined') {
      const errorMessage = graphQLErrors[0]?.message || 'An error occurred';
      console.warn(`GraphQL操作失败: ${errorMessage}`);
      // 可以集成 toast 库显示提示
      // toast.error(errorMessage);
    }
  }

  // 网络错误处理
  if (networkError) {
    console.error(`[Network Error]: ${networkError}`);

    if (typeof window !== 'undefined') {
      // 检查网络连接
      if (!navigator.onLine) {
        console.error('您处于离线状态，请检查网络连接');
        // toast.error('You are offline');
      } else {
        console.error('网络错误，请稍后重试');
        // toast.error('Network error occurred');
      }
    }
  }
});
