/**
 * Interface representing statistics for a top article in the daily report.
 */
export interface TopArticleStat {
  rank: number;
  title: string;
  allTimeLikes: number;
  likesGained: number;
}

/**
 * Interface representing the daily report data structure.
 */
export interface DailyReportData {
  date: string;
  totalLikesGained: number;
  topArticles: TopArticleStat[];
}
