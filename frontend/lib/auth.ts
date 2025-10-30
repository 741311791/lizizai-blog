import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  avatar?: {
    url: string;
    formats?: {
      thumbnail?: { url: string };
      small?: { url: string };
    };
  };
  website?: string;
  location?: string;
  confirmed: boolean;
  blocked: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  identifier: string; // email or username
  password: string;
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

/**
 * 注册新用户
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/local/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Registration failed');
  }

  const authData: AuthResponse = await response.json();
  
  // 保存 token 和用户信息
  setToken(authData.jwt);
  setUser(authData.user);
  
  return authData;
}

/**
 * 用户登录
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/local`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Login failed');
  }

  const authData: AuthResponse = await response.json();
  
  // 保存 token 和用户信息
  setToken(authData.jwt);
  setUser(authData.user);
  
  return authData;
}

/**
 * 用户登出
 */
export function logout(): void {
  removeToken();
  removeUser();
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/users/me?populate=avatar`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token 可能已过期
      logout();
      return null;
    }

    const user: User = await response.json();
    setUser(user);
    
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    logout();
    return null;
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(userId: number, data: Partial<User>): Promise<User> {
  const token = getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Update failed');
  }

  const user: User = await response.json();
  setUser(user);
  
  return user;
}

/**
 * 上传用户头像
 */
export async function uploadAvatar(userId: number, file: File): Promise<User> {
  const token = getToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('files', file);
  formData.append('ref', 'plugin::users-permissions.user');
  formData.append('refId', userId.toString());
  formData.append('field', 'avatar');

  const response = await fetch(`${API_URL.replace('/api', '')}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Upload failed');
  }

  // 重新获取用户信息
  return getCurrentUser() as Promise<User>;
}

// Token 管理
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// 用户信息管理
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
}

// 检查是否已登录
export function isAuthenticated(): boolean {
  return !!getToken();
}
