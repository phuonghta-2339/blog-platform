import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import { ArticlesService } from '@modules/articles/articles.service';
import { ArticleSummaryDto } from './dto/article-summary.dto';
import { FavoriteResponseDto } from './dto/favorite-response.dto';

/**
 * Favorites Service
 * Handles idempotent favorite/unfavorite operations with transaction safety
 * All operations are idempotent - safe to retry without errors
 */
@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly articlesService: ArticlesService,
  ) {}

  /**
   * Map article data to ArticleSummaryDto
   * @param article - Article data with counts
   * @param favorited - Whether user has favorited
   * @returns Transformed DTO
   */
  private mapToArticleSummary(
    article: { slug: string; title: string; favoritesCount: number },
    favorited: boolean,
  ): ArticleSummaryDto {
    return plainToInstance(
      ArticleSummaryDto,
      {
        slug: article.slug,
        title: article.title,
        favoritesCount: article.favoritesCount,
        favorited,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Favorite an article (idempotent operation)
   * Safe to call multiple times - no error if already favorited
   * Uses transaction to atomically increment favoritesCount
   * @param articleId - Article ID
   * @param userId - User ID
   * @returns Article summary with updated favorite status
   */
  async favoriteArticle(
    articleId: number,
    userId: number,
  ): Promise<FavoriteResponseDto> {
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Validate article exists and is published (specialized method for clarity)
          await this.articlesService.validateArticlePublishedById(
            articleId,
            tx,
          );

          // Try to create favorite (concurrency-safe, idempotent)
          // If concurrent request creates it first, catch P2002 and return current state
          try {
            await tx.favorite.create({
              data: {
                userId,
                articleId,
              },
            });

            // Successfully created, increment article favoritesCount
            const updatedArticle = await tx.article.update({
              where: { id: articleId },
              data: { favoritesCount: { increment: 1 } },
              select: {
                slug: true,
                title: true,
                favoritesCount: true,
              },
            });

            return {
              slug: updatedArticle.slug,
              title: updatedArticle.title,
              favoritesCount: updatedArticle.favoritesCount,
              favorited: true,
            };
          } catch (error) {
            // Handle unique constraint violation (P2002): already favorited
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002'
            ) {
              // Race condition: another request created the favorite first
              // Get current article summary (specialized method for common fields)
              const currentArticle =
                await this.articlesService.getArticleSummaryById(articleId, tx);

              return {
                slug: currentArticle.slug,
                title: currentArticle.title,
                favoritesCount: currentArticle.favoritesCount,
                favorited: true,
              };
            }
            // Re-throw other errors
            throw error;
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      this.logger.log(
        `Article favorited: articleId=${articleId}, userId=${userId}`,
      );

      const articleSummary = this.mapToArticleSummary(result, result.favorited);
      return plainToInstance(
        FavoriteResponseDto,
        { article: articleSummary },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error(
        `Failed to favorite article: articleId=${articleId}, userId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Unfavorite an article (idempotent operation)
   * Safe to call multiple times - no error if not favorited
   * Uses transaction to atomically decrement favoritesCount
   * @param articleId - Article ID
   * @param userId - User ID
   * @returns Article summary with updated favorite status
   */
  async unfavoriteArticle(
    articleId: number,
    userId: number,
  ): Promise<FavoriteResponseDto> {
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Get article summary (specialized method for common fields)
          const article = await this.articlesService.getArticleSummaryById(
            articleId,
            tx,
          );

          // Delete favorite using deleteMany (concurrency-safe, idempotent)
          // deleteMany returns count=0 if not found, no P2025 error thrown
          const { count: deletedCount } = await tx.favorite.deleteMany({
            where: {
              userId,
              articleId,
            },
          });

          // Only decrement count if actually deleted (handles race conditions & idempotency)
          let finalArticle: {
            slug: string;
            title: string;
            favoritesCount: number;
          };
          if (deletedCount > 0) {
            const updated = await tx.article.update({
              where: { id: articleId },
              data: { favoritesCount: { decrement: 1 } },
              select: {
                slug: true,
                title: true,
                favoritesCount: true,
              },
            });
            finalArticle = updated;
          } else {
            // Not favorited or race condition: use current article state
            finalArticle = {
              slug: article.slug,
              title: article.title,
              favoritesCount: article.favoritesCount,
            };
          }

          return {
            slug: finalArticle.slug,
            title: finalArticle.title,
            favoritesCount: finalArticle.favoritesCount,
            favorited: false,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      this.logger.log(
        `Article unfavorited: articleId=${articleId}, userId=${userId}`,
      );

      const articleSummary = this.mapToArticleSummary(result, result.favorited);
      return plainToInstance(
        FavoriteResponseDto,
        { article: articleSummary },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error(
        `Failed to unfavorite article: articleId=${articleId}, userId=${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Check if user has favorited specific articles (batch operation)
   * Optimized to avoid N+1 queries
   * @param userId - User ID
   * @param articleIds - Array of article IDs to check
   * @returns Set of favorited article IDs
   */
  async batchCheckFavorited(
    userId: number,
    articleIds: number[],
  ): Promise<Set<number>> {
    if (articleIds.length === 0) {
      return new Set();
    }

    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        articleId: { in: articleIds },
      },
      select: { articleId: true },
    });

    return new Set(favorites.map((f) => f.articleId));
  }

  /**
   * Check if user has favorited a single article
   * @param userId - User ID
   * @param articleId - Article ID
   * @returns True if favorited
   */
  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        unique_user_article_favorite: {
          userId,
          articleId,
        },
      },
    });

    return !!favorite;
  }

  /**
   * Get all article IDs favorited by user
   * Used for filtering in article queries
   * @param userId - User ID
   * @returns Array of favorited article IDs
   */
  async getFavoritedArticleIds(userId: number): Promise<number[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { articleId: true },
    });

    return favorites.map((f) => f.articleId);
  }
  /**
   * Count new favorites for an article within a date range
   * Used for daily report statistics
   * @param articleId - Article ID
   * @param start - Start date
   * @param end - End date
   * @returns Number of favorites created in range
   */
  async countFavoritesForArticleInRange(
    articleId: number,
    start: Date,
    end: Date,
  ): Promise<number> {
    try {
      return await this.prisma.favorite.count({
        where: {
          articleId,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to count favorites for article ${articleId} in range: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Return 0 instead of throwing to avoid breaking the entire report
      return 0;
    }
  }
  /**
   * Batch count new favorites for multiple articles within a date range
   * Used for daily report statistics - eliminates N+1 queries
   * @param articleIds - Array of Article IDs
   * @param start - Start date
   * @param end - End date
   * @returns Map of articleId to count
   */
  async countFavoritesForArticlesInRange(
    articleIds: number[],
    start: Date,
    end: Date,
  ): Promise<Map<number, number>> {
    try {
      if (!articleIds.length) {
        return new Map();
      }

      const results = await this.prisma.favorite.groupBy({
        by: ['articleId'],
        where: {
          articleId: { in: articleIds },
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        _count: {
          _all: true,
        },
      });

      // Transform generic groupBy result into a Map for O(1) lookup
      const countMap = new Map<number, number>();
      results.forEach((result) => {
        countMap.set(result.articleId, result._count._all);
      });

      return countMap;
    } catch (error) {
      this.logger.error(
        `Failed to batch count favorites: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Return empty map on failure to not break report generation completely
      return new Map();
    }
  }
}
