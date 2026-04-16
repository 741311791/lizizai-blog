/**
 * 归档分组工具函数
 */

/**
 * 将文章列表按年月分组
 */
export function groupArticlesByYearMonth(articles: Array<{
  publishedAt: string;
  [key: string]: any;
}>): Record<string, Record<string, Array<{
  publishedAt: string;
  [key: string]: any;
}>>> {
  const grouped: Record<string, Record<string, Array<{
    publishedAt: string;
    [key: string]: any;
  }>>> = {};

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
  const result: Record<string, Record<string, Array<{
    publishedAt: string;
    [key: string]: any;
  }>>> = {};

  sortedYears.forEach((year) => {
    const monthOrder = [
      'December', 'November', 'October', 'September',
      'August', 'July', 'June', 'May',
      'April', 'March', 'February', 'January',
    ];

    const sortedMonths = Object.keys(grouped[year]).sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );

    result[year] = {};
    sortedMonths.forEach((month) => {
      result[year][month] = grouped[year][month].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });
  });

  return result;
}
