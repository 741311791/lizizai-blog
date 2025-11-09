/**
 * 后端 API 调用封装
 *
 * 提供类型安全的后端 API 调用方法
 */

import { config } from './env';

const BACKEND_TIMEOUT = 30000; // 30 seconds

export class BackendAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'BackendAPIError';
  }
}

/**
 * 调用后端订阅 API
 */
export async function createSubscription(
  email: string,
  name: string
): Promise<{
  message: string;
  requiresConfirmation?: boolean;
  subscriber?: { email: string; name: string };
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

  try {
    const response = await fetch(`${config.strapiUrl}/api/subscribers/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new BackendAPIError('Invalid response from server', 500, jsonError);
    }

    if (!response.ok) {
      throw new BackendAPIError(
        data.error?.message || 'Subscription failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof BackendAPIError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new BackendAPIError('Request timeout. Please try again.', 504);
    }

    throw new BackendAPIError(
      'Network error. Please check your connection and try again.',
      503,
      error
    );
  }
}

/**
 * 确认订阅
 */
export async function confirmSubscription(token: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

  try {
    const response = await fetch(
      `${config.strapiUrl}/api/subscribe/confirm?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new BackendAPIError(
        data.error?.message || 'Confirmation failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof BackendAPIError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new BackendAPIError('Request timeout. Please try again.', 504);
    }

    throw new BackendAPIError('Network error occurred', 503, error);
  }
}
