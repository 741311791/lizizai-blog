export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': (() => {
            // 从环境变量读取允许的图片源
            const envSources = process.env.CSP_IMG_SRC?.split(',')
              .map(s => s.trim())
              .filter(Boolean) || [];

            // 默认源
            const defaultSources = [
              "'self'",
              'data:',
              'blob:',
              'https://lizizai.xyz',
              'http://localhost:3000',
            ];

            return envSources.length > 0 ? [...defaultSources, ...envSources] : defaultSources;
          })(),
          'media-src': (() => {
            // 从环境变量读取允许的媒体源
            const envSources = process.env.CSP_MEDIA_SRC?.split(',')
              .map(s => s.trim())
              .filter(Boolean) || [];

            // 默认源
            const defaultSources = [
              "'self'",
              'data:',
              'blob:',
              'https://lizizai.xyz',
              'http://localhost:3000',
            ];

            return envSources.length > 0 ? [...defaultSources, ...envSources] : defaultSources;
          })(),
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (() => {
        // 从环境变量读取 CORS 源
        const envOrigins = process.env.CORS_ORIGINS?.split(',')
          .map(o => o.trim())
          .filter(Boolean) || [];

        // 默认源（用于未配置环境变量时）
        const defaultOrigins = [
          'http://localhost:3000',
          'https://lizizai.xyz',
        ];

        return envOrigins.length > 0 ? envOrigins : defaultOrigins;
      })(),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
