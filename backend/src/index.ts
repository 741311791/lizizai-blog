export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: any) {
    // Register custom routes
    strapi.server.routes([
      {
        method: 'POST',
        path: '/api/subscribers/subscribe',
        handler: 'api::subscriber.subscriber.subscribe',
        config: {
          auth: false,
        },
      },
      {
        method: 'POST',
        path: '/api/subscribers/unsubscribe',
        handler: 'api::subscriber.subscriber.unsubscribe',
        config: {
          auth: false,
        },
      },
      {
        method: 'GET',
        path: '/api/subscribers/count',
        handler: 'api::subscriber.subscriber.count',
        config: {
          auth: false,
        },
      },
    ]);
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: any) {
    // Log that the application is starting
    strapi.log.info('Strapi application is starting...');
    
    // Ensure subscriber table exists
    try {
      const count = await strapi.db.query('api::subscriber.subscriber').count();
      strapi.log.info(`Subscriber table initialized. Current count: ${count}`);
    } catch (error) {
      strapi.log.error('Failed to initialize subscriber table:', error);
    }
  },
};
