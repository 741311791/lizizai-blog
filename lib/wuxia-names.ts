/**
 * 武侠风格访客昵称生成器
 * 根据种子确定性生成昵称，同一种子始终得到同一名字
 */

// 复姓列表
const COMPOUND_SURNAMES = [
  '慕容', '独孤', '令狐', '欧阳', '上官', '司马', '东方', '西门',
  '南宫', '诸葛', '皇甫', '公孙', '段', '萧', '叶', '林',
  '苏', '陆', '沈', '顾', '楚', '秦', '谢', '韩',
  '白', '江', '柳', '云', '风', '凌', '秋', '寒',
];

// 名字列表（单字 + 双字混合）
const GIVEN_NAMES = [
  '无痕', '听雨', '乘风', '望月', '飞鸿', '破晓', '归尘', '落霞',
  '清歌', '惊鸿', '长风', '流云', '踏雪', '寻梅', '揽星', '追风',
  '含光', '照影', '听风', '观澜', '临渊', '沐雨', '知秋', '见山',
  '忘机', '逍遥', '如风', '自在', '无涯', '若水', '长安', '未央',
  '青衫', '白衣', '素衣', '红袖', '紫衣', '碧落', '苍穹', '星辰',
  '墨竹', '青莲', '寒梅', '幽兰', '霜叶', '烟雨', '浮生', '半夏',
];

/**
 * 根据种子字符串确定性生成一个伪随机数（0~1）
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // 正规化到 0~1
  return Math.abs(hash) / 2147483647;
}

/**
 * 根据种子确定性生成武侠风格昵称
 * @param seed 种子字符串（通常为 UUID）
 * @returns 昵称，如 "叶无痕"、"独孤听雨"
 */
export function generateGuestNickname(seed: string): string {
  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + '_given');

  const surname = COMPOUND_SURNAMES[Math.floor(rand1 * COMPOUND_SURNAMES.length)];
  const givenName = GIVEN_NAMES[Math.floor(rand2 * GIVEN_NAMES.length)];

  return surname + givenName;
}
