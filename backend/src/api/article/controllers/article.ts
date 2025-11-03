/**
 * article controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;
    
    const entity = await strapi.entityService.findMany('api::article.article', {
      ...query,
      populate: {
        featuredImage: true,
        author: {
          populate: ['avatar']
        },
        category: true,
        seo: true
      }
    });
    
    return entity;
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    
    const entity = await strapi.entityService.findOne('api::article.article', id, {
      populate: {
        featuredImage: true,
        author: {
          populate: ['avatar']
        },
        category: true,
        seo: true
      }
    });
    
    // Increment view count
    if (entity) {
      await strapi.entityService.update('api::article.article', id, {
        data: {
          views: (entity.views || 0) + 1
        }
      });
    }
    
    return entity;
  },

  async incrementLikes(ctx) {
    const { id } = ctx.params;
    
    const entity = await strapi.entityService.findOne('api::article.article', id);
    
    if (!entity) {
      return ctx.notFound('Article not found');
    }
    
    const updated = await strapi.entityService.update('api::article.article', id, {
      data: {
        likes: (entity.likes || 0) + 1
      }
    });
    
    return updated;
  },

  /**
   * Anonymous like functionality
   * POST /api/articles/:id/like
   */
  async likeArticle(ctx) {
    try {
      const { id } = ctx.params;
      const { visitorId } = ctx.request.body;

      // Validate visitorId
      if (!visitorId || typeof visitorId !== 'string') {
        return ctx.badRequest('Invalid visitorId');
      }

      // Check if article exists
      const article = await strapi.entityService.findOne('api::article.article', id);
      if (!article) {
        return ctx.notFound('Article not found');
      }

      // Check if visitor has already liked this article
      const existingLike = await strapi.db.query('api::like.like').findOne({
        where: {
          article: id,
          visitorId: visitorId,
        },
      });

      if (existingLike) {
        return ctx.send({
          message: 'Already liked',
          alreadyLiked: true,
          likes: article.likes || 0,
        });
      }

      // Check rate limiting: same visitorId can only like once per minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentLike = await strapi.db.query('api::like.like').findOne({
        where: {
          visitorId: visitorId,
          likedAt: {
            $gte: oneMinuteAgo,
          },
        },
      });

      if (recentLike) {
        return ctx.send({
          message: 'Rate limit exceeded. Please wait before liking again.',
          rateLimited: true,
          likes: article.likes || 0,
        });
      }

      // Create like record
      await strapi.db.query('api::like.like').create({
        data: {
          article: id,
          visitorId: visitorId,
          likedAt: new Date(),
        },
      });

      // Increment article likes count
      const updatedArticle = await strapi.entityService.update('api::article.article', id, {
        data: {
          likes: (article.likes || 0) + 1,
        },
      });

      strapi.log.info(`Article ${id} liked by visitor ${visitorId}`);

      return ctx.send({
        message: 'Article liked successfully',
        success: true,
        likes: updatedArticle.likes,
      });
    } catch (error) {
      strapi.log.error('Like article error:', error);
      return ctx.internalServerError('Failed to like article');
    }
  }
}));
