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
 * 转换 Strapi 响应数据格式
 */
export function transformStrapiResponse<T>(data: any): T {
  if (!data) return data;

  // 处理单个对象
  if (data.data && !Array.isArray(data.data)) {
    return transformStrapiItem(data.data);
  }

  // 处理数组
  if (data.data && Array.isArray(data.data)) {
    return data.data.map(transformStrapiItem) as T;
  }

  return data;
}

/**
 * 转换单个 Strapi 数据项
 */
function transformStrapiItem(item: any): any {
  if (!item) return item;

  const { id, attributes } = item;
  
  if (!attributes) return item;

  // 递归处理嵌套的关联数据
  const transformed: any = { id };

  Object.keys(attributes).forEach((key) => {
    const value = attributes[key];

    // 处理关联数据
    if (value?.data) {
      if (Array.isArray(value.data)) {
        transformed[key] = value.data.map(transformStrapiItem);
      } else {
        transformed[key] = transformStrapiItem(value.data);
      }
    } 
    // 处理媒体文件
    else if (key === 'url' && typeof value === 'string') {
      transformed[key] = getStrapiMedia(value);
    }
    // 普通字段
    else {
      transformed[key] = value;
    }
  });

  return transformed;
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
    meta: data.meta,
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
    'populate[comments][populate][0]': 'replies',
  });

  const articles = transformStrapiResponse(data);
  return Array.isArray(articles) && articles.length > 0 ? articles[0] : null;
}

/**
 * 获取热门文章
 */
export async function getPopularArticles(limit: number = 4) {
  return getArticles({
    pageSize: limit,
    sort: 'likes:desc',
  });
}

/**
 * 获取最新文章
 */
export async function getLatestArticles(limit: number = 9) {
  return getArticles({
    pageSize: limit,
    sort: 'publishedAt:desc',
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
    'populate[featuredImage]': '*',
    'pagination[pageSize]': limit,
    'sort': 'publishedAt:desc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta,
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

  return transformStrapiResponse(data);
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
  return Array.isArray(categories) && categories.length > 0 ? categories[0] : null;
}

/**
 * 获取分类下的文章
 */
export async function getArticlesByCategory(categorySlug: string, page: number = 1, pageSize: number = 12) {
  return getArticles({
    page,
    pageSize,
    filters: {
      'category][slug][$eq': categorySlug,
    },
  });
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

  return transformStrapiResponse(data);
}

/**
 * 根据 slug 获取作者
 */
export async function getAuthorBySlug(slug: string) {
  const data = await fetchAPI('/authors', {}, {
    'filters[slug][$eq]': slug,
    'populate[avatar]': '*',
  });

  const authors = transformStrapiResponse(data);
  return Array.isArray(authors) && authors.length > 0 ? authors[0] : null;
}

// ============= Tags API =============

/**
 * 获取所有标签
 */
export async function getTags() {
  const data = await fetchAPI('/tags', {}, {
    'sort': 'name:asc',
  });

  return transformStrapiResponse(data);
}

// ============= Comments API =============

/**
 * 获取文章的评论
 */
export async function getCommentsByArticle(articleId: string) {
  const data = await fetchAPI('/comments', {}, {
    'filters[article][id][$eq]': articleId,
    'filters[parentComment][id][$null]': true, // 只获取顶级评论
    'populate[replies][populate]': '*',
    'sort': 'createdAt:desc',
  });

  return transformStrapiResponse(data);
}

/**
 * 创建评论
 */
export async function createComment(commentData: {
  content: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  article: string;
  parentComment?: string;
}) {
  const data = await fetchAPI('/comments', {
    method: 'POST',
    body: JSON.stringify({ data: commentData }),
  });

  return transformStrapiResponse(data);
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
    'populate[author][populate]': 'avatar',
    'populate[category]': '*',
    'populate[featuredImage]': '*',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': 'publishedAt:desc',
  });

  return {
    data: transformStrapiResponse(data),
    meta: data.meta,
  };
}
