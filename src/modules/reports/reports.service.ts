import { Injectable, Logger } from '@nestjs/common';
import { ArticlesService } from '@modules/articles/articles.service';
import { FavoritesService } from '@modules/favorites/favorites.service';

import {
  TopArticleStat,
  DailyReportData,
} from './interfaces/reports.interface';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly articlesService: ArticlesService,
    private readonly favoritesService: FavoritesService,
  ) {}

  /**
   * Calculate daily engagement stats
   * @returns Report data including top 5 articles and their 24h delta
   */
  async getDailyEngagementStats(): Promise<DailyReportData> {
    this.logger.log('Generating daily engagement stats...');
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().split('T')[0];

    // 1. Fetch Top 5 Articles by all-time likes via ArticlesService
    const topArticles = await this.articlesService.getTopLikedArticles(5);

    // 2. Batch Calculate Delta (likes gained in last 24h) via FavoritesService
    // Extract IDs first to perform a single query
    const articleIds = topArticles.map((a) => a.id);
    const likesMap =
      await this.favoritesService.countFavoritesForArticlesInRange(
        articleIds,
        yesterday,
        now,
      );

    const stats: TopArticleStat[] = [];
    let totalLikesGained = 0;

    // Map results using the in-memory map (O(1) lookup inside loop)
    for (const [index, article] of topArticles.entries()) {
      const likesGained = likesMap.get(article.id) || 0;

      stats.push({
        rank: index + 1,
        title: article.title,
        allTimeLikes: article.favoritesCount,
        likesGained,
      });

      totalLikesGained += likesGained;
    }

    this.logger.log(
      `Generated report for ${formattedDate}: ${stats.length} articles, ${totalLikesGained} new likes`,
    );

    return {
      date: formattedDate,
      totalLikesGained,
      topArticles: stats,
    };
  }
}
