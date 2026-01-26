import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
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

  constructor(private readonly prisma: PrismaService) {}

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
          // Check if article exists and is published
          const article = await tx.article.findUnique({
            where: { id: articleId },
            select: {
              id: true,
              slug: true,
              title: true,
              isPublished: true,
              favoritesCount: true,
            },
          });

          if (!article) {
            throw new NotFoundException('Article not found');
          }

          if (!article.isPublished) {
            throw new BadRequestException(
              'Cannot favorite unpublished articles',
            );
          }

          // Check if already favorited (idempotent check)
          const existingFavorite = await tx.favorite.findUnique({
            where: {
              unique_user_article_favorite: {
                userId,
                articleId,
              },
            },
          });

          // If already favorited, return current state (idempotent)
          if (existingFavorite) {
            return {
              slug: article.slug,
              title: article.title,
              favoritesCount: article.favoritesCount,
              favorited: true,
            };
          }

          // Create favorite
          await tx.favorite.create({
            data: {
              userId,
              articleId,
            },
          });

          // Increment article favoritesCount
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
          // Check if article exists
          const article = await tx.article.findUnique({
            where: { id: articleId },
            select: {
              id: true,
              slug: true,
              title: true,
              favoritesCount: true,
            },
          });

          if (!article) {
            throw new NotFoundException('Article not found');
          }

          // Check if favorited (idempotent check)
          const existingFavorite = await tx.favorite.findUnique({
            where: {
              unique_user_article_favorite: {
                userId,
                articleId,
              },
            },
          });

          // If not favorited, return current state (idempotent)
          if (!existingFavorite) {
            return {
              slug: article.slug,
              title: article.title,
              favoritesCount: article.favoritesCount,
              favorited: false,
            };
          }

          // Delete favorite
          await tx.favorite.delete({
            where: {
              unique_user_article_favorite: {
                userId,
                articleId,
              },
            },
          });

          // Decrement article favoritesCount
          const updatedArticle = await tx.article.update({
            where: { id: articleId },
            data: { favoritesCount: { decrement: 1 } },
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
}
