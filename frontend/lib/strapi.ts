/**
 * Strapi API Client
 * 
 * 用于与 Strapi CMS 后端通信的客户端库
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://lizizai-blog.onrender.com';
const STRAPI_API_URL = `${STRAPI_URL}/api`;

/**
 * 通用 API 请求函数
 */
export async function fetchAPI(
  endpoint: string,
  options: RequestInit = {},
  params: Record<string, any> = {}
) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${STRAPI_API_URL}${endpoint}?${queryString}` : `${STRAPI_API_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    next: {
      revalidate: 60, // ISR: 每60秒重新验证
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, mergedOptions);

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`API error: ${res.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Strapi API Error:', error);
    throw error;
  }
}

/**
 * 获取图片完整 URL
 */
export function getStrapiMedia(url: string | null | undefined): string {
  if (!url) return '';
  
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http')) {
    return url;
  }
  
  // 拼接 Strapi 基础 URL
  return `${STRAPI_URL}${url}`;
}

/**
 * 转换 Strapi v5 响应数据格式
 * Strapi v5 直接返回扁平化的数据,不再使用 {data: {id, attributes}} 格式
 */
export function transformStrapiResponse<T>(data: any): T {
  if (!data) return data;

  // Strapi v5: 如果是数组,直接返回(已经是扁平化格式)
  if (Array.isArray(data)) {
    return data as T;
  }

  // Strapi v5: 如果是单个对象,直接返回(已经是扁平化格式)
  if (typeof data === 'object' && data.id) {
    return data as T;
  }

  // 兼容 Strapi v4 格式: 处理 {data: ...} 包装
  if (data.data) {
    if (Array.isArray(data.data)) {
      return data.data as T;
    }
    return data.data as T;
  }

  return data;
}

// ============= Articles API =============

/**
 * 获取所有文章
 */
export async function getArticles(params: {
  page?: number;
  pageSize?: number;
  sort?: string;
  filters?: Record<string, any>;
} = {}) {
  const queryParams: Record<string, any> = {
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'pagination[page]': params.page || 1,
    'pagination[pageSize]': params.pageSize || 12,
    'sort': params.sort || 'publishedAt:desc',
  };

  // 添加过滤条件
  if (params.filters) {
    Object.keys(params.filters).forEach((key) => {
      queryParams[`filters[${key}]`] = params.filters![key];
    });
  }
  
  const data = await fetchAPI('/articles', {}, queryParams);
  return {
    data: transformStrapiResponse(data),
    meta: data.meta || { pagination: { page: 1, pageSize: 12, pageCount: 1, total: Array.isArray(data) ? data.length : 0 } },
  };
}

/**
 * 根据 slug 获取单篇文章
 */
export async function getArticleBySlug(slug: string) {
  const data = await fetchAPI('/articles', {}, {
    'filters[slug][$eq]': slug,
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'populate[seo]': '*',
  });

  const articles = transformStrapiResponse(data);
  
  // Strapi v5 返回数组,取第一个元素
  if (Array.isArray(articles) && articles.length > 0) {
    return articles[0];
  }
  
  return null;
}

/**
 * 增加文章点赞数
 */
export async function incrementArticleLikes(id: string, likes: number) {
  return fetchAPI(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { likes } }),
  });
}

/**
 * 增加文章浏览数
 */
export async function incrementArticleViews(id: string, views: number) {
  return fetchAPI(`/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { views } }),
  });
}

/**
 * 获取相关文章
 */
export async function getRelatedArticles(categorySlug: string, currentArticleId: string, limit: number = 3) {
  const data = await fetchAPI('/articles', {}, {
    'filters[category][slug][$eq]': categorySlug,
    'filters[id][$ne]': currentArticleId,
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'pagination[limit]': limit,
    'sort': 'publishedAt:desc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta || {},
  };
}

// ============= Categories API =============

/**
 * 获取所有分类
 */
export async function getCategories() {
  const data = await fetchAPI('/categories', {}, {
    'populate': '*',
    'sort': 'name:asc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta || {},
  };
}

/**
 * 根据 slug 获取分类
 */
export async function getCategoryBySlug(slug: string) {
  const data = await fetchAPI('/categories', {}, {
    'filters[slug][$eq]': slug,
    'populate': '*',
  });

  const categories = transformStrapiResponse(data);
  
  if (Array.isArray(categories) && categories.length > 0) {
    return categories[0];
  }
  
  return null;
}

/**
 * 根据分类获取文章
 */
export async function getArticlesByCategory(categorySlug: string, page: number = 1, pageSize: number = 12) {
  const data = await fetchAPI('/articles', {}, {
    'filters[category][slug][$eq]': categorySlug,
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': 'publishedAt:desc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta || {},
  };
}

// ============= Tags API =============

/**
 * 获取所有标签
 */
export async function getTags() {
  const data = await fetchAPI('/tags', {}, {
    'populate': '*',
    'sort': 'name:asc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta || {},
  };
}

/**
 * 根据 slug 获取标签
 */
export async function getTagBySlug(slug: string) {
  const data = await fetchAPI('/tags', {}, {
    'filters[slug][$eq]': slug,
    'populate': '*',
  });

  const tags = transformStrapiResponse(data);
  
  if (Array.isArray(tags) && tags.length > 0) {
    return tags[0];
  }
  
  return null;
}

/**
 * 根据标签获取文章
 */
export async function getArticlesByTag(tagSlug: string, page: number = 1, pageSize: number = 12) {
  const data = await fetchAPI('/articles', {}, {
    'filters[tags][slug][$eq]': tagSlug,
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': 'publishedAt:desc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta || {},
  };
}

// ============= Authors API =============

/**
 * 获取所有作者
 */
export async function getAuthors() {
  const data = await fetchAPI('/authors', {}, {
    'populate[avatar]': '*',
    'sort': 'name:asc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta || {},
  };
}

/**
 * 根据 ID 获取作者
 */
export async function getAuthorById(id: string) {
  const data = await fetchAPI(`/authors/${id}`, {}, {
    'populate[avatar]': '*',
    'populate[articles][populate]': 'featuredImage,category',
  });

  return transformStrapiResponse(data);
}

/**
 * 根据作者获取文章
 */
export async function getArticlesByAuthor(authorId: string, page: number = 1, pageSize: number = 12) {
  const data = await fetchAPI('/articles', {}, {
    'filters[author][id][$eq]': authorId,
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': 'publishedAt:desc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta || {},
  };
}

// ============= Search API =============

/**
 * 搜索文章
 */
export async function searchArticles(query: string, page: number = 1, pageSize: number = 12) {
  const data = await fetchAPI('/articles', {}, {
    'filters[$or][0][title][$containsi]': query,
    'filters[$or][1][subtitle][$containsi]': query,
    'filters[$or][2][excerpt][$containsi]': query,
    'filters[$or][3][content][$containsi]': query,
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[tags]': '*',
    'populate[featuredImage]': '*',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': 'publishedAt:desc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta || {},
  };
}

// ============= Newsletter API =============

/**
 * 订阅 Newsletter
 */
export async function subscribeNewsletter(email: string) {
  return fetchAPI('/subscribers/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * 取消订阅 Newsletter
 */
export async function unsubscribeNewsletter(email: string) {
  return fetchAPI('/subscribers/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * 获取 Newsletter 统计
 */
export async function getNewsletterStats() {
  return fetchAPI('/subscribers/count');
}
