/**
 * 日志工具类
 *
 * 功能:
 * - 环境感知的日志级别
 * - 敏感信息保护
 * - 结构化日志输出
 */

/**
 * 开发环境详细日志
 * 仅在开发环境输出
 */
export const dev = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    strapi.log.debug(message, data);
  }
};

/**
 * 敏感信息日志
 * 开发环境: 显示完整信息
 * 生产环境: 只记录操作,隐藏敏感数据
 */
export const sensitive = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    strapi.log.debug(`[SENSITIVE] ${message}`, data);
  } else {
    // 生产环境只记录操作,移除数据部分
    const sanitizedMessage = message.split(':')[0];
    strapi.log.info(sanitizedMessage);
  }
};

/**
 * 信息日志（生产环境可见）
 */
export const info = (message: string, data?: any) => {
  if (data) {
    strapi.log.info(message, data);
  } else {
    strapi.log.info(message);
  }
};

/**
 * 警告日志
 */
export const warn = (message: string, data?: any) => {
  if (data) {
    strapi.log.warn(message, data);
  } else {
    strapi.log.warn(message);
  }
};

/**
 * 错误日志（始终记录完整信息）
 */
export const error = (message: string, err: any) => {
  strapi.log.error(message, err);
};

/**
 * 日志工具对象（导出为默认对象）
 */
export const logger = {
  dev,
  sensitive,
  info,
  warn,
  error,
};

export default logger;
