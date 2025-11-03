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
        policies: [],
        middlewares: [],
      },
    },
  ],
};
