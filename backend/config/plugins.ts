export default () => ({
  email: {
    config: {
      provider: 'resend',
      providerOptions: {
        apiKey: process.env.RESEND_API_KEY,
      },
      settings: {
        defaultFrom: 'future/proof <noreply@lizizai.xyz>',
        defaultReplyTo: 'support@lizizai.xyz',
      },
    },
  },
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
