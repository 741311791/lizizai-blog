import { generateGuestNickname } from './wuxia-names';

/**
 * 访客身份信息
 */
export interface GuestIdentity {
  /** 唯一标识（UUID） */
  id: string;
  /** 武侠风格昵称 */
  nickname: string;
  /** DiceBear 头像 URL */
  avatarUrl: string;
}

const GUEST_ID_KEY = 'lizizai_guest_id';

/**
 * 获取或创建访客身份
 * 首次访问时自动生成，后续从 localStorage 读取
 * 同一浏览器会话内身份保持一致
 */
export function getOrCreateGuestIdentity(): GuestIdentity {
  if (typeof window === 'undefined') {
    // SSR 时返回临时身份（不应被使用，仅做类型兼容）
    return {
      id: '',
      nickname: '访客',
      avatarUrl: '',
    };
  }

  const existing = localStorage.getItem(GUEST_ID_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as GuestIdentity;
    } catch {
      // 解析失败，重新生成
    }
  }

  const id = crypto.randomUUID();
  const identity: GuestIdentity = {
    id,
    nickname: generateGuestNickname(id),
    avatarUrl: `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(id)}`,
  };
  localStorage.setItem(GUEST_ID_KEY, JSON.stringify(identity));
  return identity;
}
