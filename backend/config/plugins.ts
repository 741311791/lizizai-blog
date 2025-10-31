export default () => ({
  // 暂时禁用邮件功能，等系统稳定后再启用
  // email: {
  //   config: {
  //     provider: 'resend',
  //     providerOptions: {
  //       apiKey: process.env.RESEND_API_KEY,
  //     },
  //     settings: {
  //       defaultFrom: 'future/proof <noreply@lizizai.xyz>',
  //       defaultReplyTo: 'support@lizizai.xyz',
  //     },
  //   },
  // },
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: true,
      depthLimit: 10,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
      },
    },
  },
});
