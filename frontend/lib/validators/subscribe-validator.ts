/**
 * 订阅输入验证器
 *
 * 使用 Zod 进行订阅数据的验证和转换
 */

import { z } from 'zod';

export const subscribeInputSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase()
    .transform((val) => val.trim()),
  name: z
    .string()
    .optional()
    .transform((val) => val?.trim() || ''),
});

export type SubscribeInput = z.infer<typeof subscribeInputSchema>;

/**
 * 验证订阅输入
 */
export function validateSubscribeInput(body: unknown): SubscribeInput {
  try {
    return subscribeInputSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(firstError.message);
    }
    throw new Error('Invalid input');
  }
}
