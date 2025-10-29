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
  }
}));
