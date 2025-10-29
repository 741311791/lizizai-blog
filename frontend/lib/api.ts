const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { params, ...fetchOptions } = options;
  
  let url = `${API_URL}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Articles
  getArticles: (params?: Record<string, string>) => 
    fetchAPI('/articles', { 
      params: {
        'populate': '*',
        ...params
      }
    }),
  
  getArticleBySlug: (slug: string) =>
    fetchAPI('/articles', {
      params: {
        'filters[slug][$eq]': slug,
        'populate': '*',
      }
    }),
  
  incrementArticleLikes: (id: string, likes: number) =>
    fetchAPI(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: { likes } }),
    }),

  // Categories
  getCategories: () =>
    fetchAPI('/categories', {
      params: {
        'populate': '*',
      }
    }),

  // Newsletter
  subscribeNewsletter: (email: string) =>
    fetchAPI('/newsletters', {
      method: 'POST',
      body: JSON.stringify({ data: { email, status: 'active' } }),
    }),

  // Comments
  getCommentsByArticle: (articleId: string) =>
    fetchAPI('/comments', {
      params: {
        'filters[article][id][$eq]': articleId,
        'populate': '*',
        'sort': 'createdAt:desc',
      }
    }),

  createComment: (data: { content: string; article: string; author: string }) =>
    fetchAPI('/comments', {
      method: 'POST',
      body: JSON.stringify({ data }),
    }),
};
