export default {
  async check(ctx) {
    try {
      // Check database connection
      await strapi.db.connection.raw('SELECT 1');
      
      ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      };
    } catch (error) {
      ctx.status = 503;
      ctx.body = {
        status: 'error',
        message: 'Service unavailable',
        error: error.message,
      };
    }
  },
};
