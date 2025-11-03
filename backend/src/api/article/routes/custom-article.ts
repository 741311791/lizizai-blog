/**
 * Custom article routes
 */

export default {
  routes: [
    {
      method: 'POST',
      path: '/articles/:id/like',
      handler: 'article.likeArticle',
      config: {
        auth: false,  // Allow public access without authentication
        policies: [],
        middlewares: [],
      },
    },
  ],
};
