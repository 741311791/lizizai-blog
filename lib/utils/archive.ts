/**
 * 归档分组工具函数
 */

export interface ArchiveGroupedArticles<T> {
  [year: string]: {
    /** 数字月份键 "1"-"12"，展示时按 locale 格式化 */
    [month: string]: T[];
  };
}

/**
 * 将文章列表按年月分组。
 * 月份以数字字符串为键（与展示 locale 解耦），按降序排列。
 */
export function groupArticlesByYearMonth<T extends { publishedAt: string }>(
  articles: T[]
): ArchiveGroupedArticles<T> {
  const grouped: ArchiveGroupedArticles<T> = {};

  articles.forEach((article) => {
    const date = new Date(article.publishedAt);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString();

    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];

    grouped[year][month].push(article);
  });

  // 年份降序、月份降序；组内按发布时间降序
  const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
  const result: ArchiveGroupedArticles<T> = {};

  sortedYears.forEach((year) => {
    const sortedMonths = Object.keys(grouped[year]).sort((a, b) => parseInt(b) - parseInt(a));
    result[year] = {};
    sortedMonths.forEach((month) => {
      result[year][month] = grouped[year][month].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });
  });

  return result;
}
