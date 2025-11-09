/**
 * Mock 数据 - 用作 API 失败时的兜底数据
 *
 * 注意：这些数据仅在无法连接到 Strapi 后端时使用
 */

export const mockCategories: Record<string, any> = {
  'ai-prompts': {
    id: '1',
    documentId: 'ai-prompts-doc',
    name: 'AI & Prompts',
    slug: 'ai-prompts',
    description: 'Explore the intersection of artificial intelligence and creative prompts. Learn how to leverage AI tools to enhance your productivity and creativity.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
  },
  'writing-strategies': {
    id: '2',
    documentId: 'writing-strategies-doc',
    name: 'Writing Strategies',
    slug: 'writing-strategies',
    description: 'Master the art of writing with proven strategies and techniques. From content creation to storytelling, discover how to craft compelling narratives.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
  },
  'premium-course': {
    id: '3',
    documentId: 'premium-course-doc',
    name: 'Premium Course',
    slug: 'premium-course',
    description: 'Unlock your full potential with our carefully curated premium courses. Deep dive into advanced topics and gain mastery over essential skills.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
  },
  'portfolio': {
    id: '4',
    documentId: 'portfolio-doc',
    name: 'Portfolio',
    slug: 'portfolio',
    description: 'Showcase of projects, case studies, and creative works. Explore real-world applications and learn from practical examples.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
  },
  'human-3-0': {
    id: '5',
    documentId: 'human-3-0-doc',
    name: 'HUMAN 3.0',
    slug: 'human-3-0',
    description: 'The evolution of human potential in the age of AI. Discover how to thrive in a rapidly changing world by embracing your unique human capabilities.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
  },
  'featured': {
    id: '6',
    documentId: 'featured-doc',
    name: 'Featured',
    slug: 'featured',
    description: 'Our most popular and impactful articles, handpicked for you.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
  },
  'lifestyle': {
    id: '7',
    documentId: 'lifestyle-doc',
    name: 'Lifestyle',
    slug: 'lifestyle',
    description: 'Design your ideal lifestyle with practical advice on productivity, health, and personal development.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    publishedAt: '2024-01-01T00:00:00.000Z',
  },
};

export const mockArticles = [
  {
    id: '1',
    documentId: 'article-1-doc',
    title: 'You have about 36 months to make it',
    subtitle: 'why everyone is racing to get rich',
    slug: 'you-have-36-months-to-make-it',
    content: '# Introduction\n\nThis is a mock article content...',
    excerpt: 'why everyone is racing to get rich',
    featuredImage: 'https://picsum.photos/seed/cat1/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-07-21T00:00:00.000Z',
    likes: 1844,
    views: 5234,
    commentsCount: 146,
    sharesCount: 89,
    category: {
      name: 'Featured',
      slug: 'featured',
    },
  },
  {
    id: '2',
    documentId: 'article-2-doc',
    title: 'A dopamine detox to reset your life in 30 days',
    subtitle: 'Because most of modern life has become a blur',
    slug: 'dopamine-detox-reset-life-30-days',
    content: '# Introduction\n\nThis is a mock article content...',
    excerpt: 'Because most of modern life has become a blur',
    featuredImage: 'https://picsum.photos/seed/cat2/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-10-15T00:00:00.000Z',
    likes: 2051,
    views: 6789,
    commentsCount: 69,
    sharesCount: 120,
    category: {
      name: 'Lifestyle',
      slug: 'lifestyle',
    },
  },
  {
    id: '3',
    documentId: 'article-3-doc',
    title: 'A Prompt To Reset Your Life In 30 Days',
    subtitle: 'Use AI to design your ideal life',
    slug: 'prompt-reset-life-30-days',
    content: '# Introduction\n\nThis is a mock article content...',
    excerpt: 'Use AI to design your ideal life',
    featuredImage: 'https://picsum.photos/seed/cat3/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-07-25T00:00:00.000Z',
    likes: 418,
    views: 1234,
    commentsCount: 20,
    sharesCount: 35,
    category: {
      name: 'AI & Prompts',
      slug: 'ai-prompts',
    },
  },
  {
    id: '4',
    documentId: 'article-4-doc',
    title: 'HUMAN 3.0 – A Map To Reach The Top 1%',
    subtitle: 'The evolution of human potential',
    slug: 'human-3-0-map-top-1-percent',
    content: '# Introduction\n\nThis is a mock article content...',
    excerpt: 'The evolution of human potential',
    featuredImage: 'https://picsum.photos/seed/cat4/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-08-25T00:00:00.000Z',
    likes: 1173,
    views: 3456,
    commentsCount: 80,
    sharesCount: 95,
    category: {
      name: 'HUMAN 3.0',
      slug: 'human-3-0',
    },
  },
  {
    id: '5',
    documentId: 'article-5-doc',
    title: 'How to become so focused it feels illegal',
    subtitle: 'On deep work and brain altering technology',
    slug: 'become-focused-feels-illegal',
    content: '# Introduction\n\nThis is a mock article content...',
    excerpt: 'On deep work and brain altering technology',
    featuredImage: 'https://picsum.photos/seed/cat5/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-10-09T00:00:00.000Z',
    likes: 1321,
    views: 4567,
    commentsCount: 51,
    sharesCount: 78,
    category: {
      name: 'Premium Course',
      slug: 'premium-course',
    },
  },
  {
    id: '6',
    documentId: 'article-6-doc',
    title: "Yes, the matrix is real, here's how to escape it",
    subtitle: "it's not what you think",
    slug: 'matrix-real-how-to-escape',
    content: '# Introduction\n\nThis is a mock article content...',
    excerpt: "it's not what you think",
    featuredImage: 'https://picsum.photos/seed/cat6/800/600',
    author: {
      name: 'DAN KOE',
      avatar: 'https://picsum.photos/seed/author/200/200',
    },
    publishedAt: '2025-10-02T00:00:00.000Z',
    likes: 511,
    views: 1890,
    commentsCount: 47,
    sharesCount: 62,
    category: {
      name: 'Portfolio',
      slug: 'portfolio',
    },
  },
];

/**
 * 根据分类 slug 获取 mock 文章
 */
export function getMockArticlesByCategory(categorySlug: string) {
  return mockArticles.filter(
    (article) => article.category.slug === categorySlug
  );
}

/**
 * 获取默认分类（当请求的分类不存在时）
 */
export function getDefaultCategory() {
  return mockCategories['featured'];
}

/**
 * 计算分类下的文章数量
 */
export function getCategoryArticleCount(categorySlug: string): number {
  return getMockArticlesByCategory(categorySlug).length;
}

/**
 * Mock Archive 数据 - 按年月分组
 */
export const mockArchive = {
  '2025': {
    'October': [
      {
        id: '2',
        title: 'A dopamine detox to reset your life in 30 days',
        slug: 'dopamine-detox-reset-life-30-days',
        publishedAt: '2025-10-15T00:00:00.000Z',
        likes: 2051,
        commentsCount: 69,
        category: {
          name: 'Lifestyle',
          slug: 'lifestyle',
        },
      },
      {
        id: '5',
        title: 'How to become so focused it feels illegal',
        slug: 'become-focused-feels-illegal',
        publishedAt: '2025-10-09T00:00:00.000Z',
        likes: 1321,
        commentsCount: 51,
        category: {
          name: 'Premium Course',
          slug: 'premium-course',
        },
      },
      {
        id: '6',
        title: "Yes, the matrix is real, here's how to escape it",
        slug: 'matrix-real-how-to-escape',
        publishedAt: '2025-10-02T00:00:00.000Z',
        likes: 511,
        commentsCount: 47,
        category: {
          name: 'Portfolio',
          slug: 'portfolio',
        },
      },
    ],
    'August': [
      {
        id: '4',
        title: 'HUMAN 3.0 – A Map To Reach The Top 1%',
        slug: 'human-3-0-map-top-1-percent',
        publishedAt: '2025-08-25T00:00:00.000Z',
        likes: 1173,
        commentsCount: 80,
        category: {
          name: 'HUMAN 3.0',
          slug: 'human-3-0',
        },
      },
    ],
    'July': [
      {
        id: '3',
        title: 'A Prompt To Reset Your Life In 30 Days',
        slug: 'prompt-reset-life-30-days',
        publishedAt: '2025-07-25T00:00:00.000Z',
        likes: 418,
        commentsCount: 20,
        category: {
          name: 'AI & Prompts',
          slug: 'ai-prompts',
        },
      },
      {
        id: '1',
        title: 'You have about 36 months to make it',
        slug: 'you-have-36-months-to-make-it',
        publishedAt: '2025-07-21T00:00:00.000Z',
        likes: 1844,
        commentsCount: 146,
        category: {
          name: 'Featured',
          slug: 'featured',
        },
      },
    ],
  },
};

/**
 * 将文章列表按年月分组
 */
export function groupArticlesByYearMonth(articles: any[]): Record<string, Record<string, any[]>> {
  const grouped: Record<string, Record<string, any[]>> = {};

  articles.forEach((article) => {
    const date = new Date(article.publishedAt);
    const year = date.getFullYear().toString();
    const month = date.toLocaleDateString('en-US', { month: 'long' });

    if (!grouped[year]) {
      grouped[year] = {};
    }

    if (!grouped[year][month]) {
      grouped[year][month] = [];
    }

    grouped[year][month].push(article);
  });

  // 按年份降序排序
  const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
  const result: Record<string, Record<string, any[]>> = {};

  sortedYears.forEach((year) => {
    // 按月份降序排序（October -> January）
    const monthOrder = [
      'December', 'November', 'October', 'September',
      'August', 'July', 'June', 'May',
      'April', 'March', 'February', 'January'
    ];

    const sortedMonths = Object.keys(grouped[year]).sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );

    result[year] = {};
    sortedMonths.forEach((month) => {
      // 按日期降序排序
      result[year][month] = grouped[year][month].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });
  });

  return result;
}
