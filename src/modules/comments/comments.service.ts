import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import { deleteCacheByPattern } from '@/common/helpers/cache.helper';
import { ArticlesService } from '@modules/articles/articles.service';
import { CommentWithRelations } from './types/comment-with-relations.type';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import {
  CommentResponseDto,
  CommentAuthorDto,
} from './dto/comment-response.dto';
import {
  PaginatedCommentsDto,
  PaginationMetaDto,
} from './dto/paginated-comments.dto';

/**
 * Comments Service
 * Handles CR-D operations for comments with transaction safety and denormalized counts
 */
@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly articlesService: ArticlesService,
  ) {}

  /**
   * Get reusable comment include configuration
   * Extracts common query patterns for consistent comment fetching with relations
   * @returns Prisma include configuration for comment queries
   */
  private getCommentIncludeConfig(): Prisma.CommentInclude {
    return {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    };
  }

  /**
   * Map comment with relations to CommentResponseDto
   * @param comment - Comment with relations
   * @param isFollowingAuthor - Whether current user follows the author
   * @returns Transformed DTO
   */
  private mapToCommentResponse(
    comment: CommentWithRelations,
    isFollowingAuthor: boolean,
  ): CommentResponseDto {
    // Map author
    const author = plainToInstance(
      CommentAuthorDto,
      {
        id: comment.author.id,
        username: comment.author.username,
        avatar: comment.author.avatar,
        following: isFollowingAuthor,
      },
      { excludeExtraneousValues: true },
    );

    return plainToInstance(
      CommentResponseDto,
      {
        id: comment.id,
        body: comment.body,
        articleId: comment.articleId,
        author,
        createdAt: comment.createdAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Create pagination metadata
   * @param total - Total number of items
   * @param limit - Items per page
   * @param offset - Items to skip
   * @returns Pagination metadata
   */
  private createPaginationMeta(
    total: number,
    limit: number,
    offset: number,
  ): PaginationMetaDto {
    return plainToInstance(
      PaginationMetaDto,
      {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrev: offset > 0,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Invalidate comment-related caches for specific article
   * @param articleId - Article ID to invalidate comments cache
   */
  private async invalidateCommentCaches(articleId: number): Promise<void> {
    const deletedCount = await deleteCacheByPattern(
      this.cacheManager,
      `comments:article:${articleId}:*`,
      this.logger,
    );

    if (deletedCount > 0) {
      this.logger.debug(
        `Invalidated ${deletedCount} comment cache keys for article ${articleId}`,
      );
    }
  }

  /**
   * Create a new comment on an article
   * Uses transaction to atomically increment article.commentsCount
   * @param articleId - Article ID
   * @param createDto - Comment creation data
   * @param authorId - Comment author user ID
   * @returns Created comment
   */
  async create(
    articleId: number,
    createDto: CreateCommentDto,
    authorId: number,
  ): Promise<CommentResponseDto> {
    const { body } = createDto;

    try {
      // Use transaction for atomic operations
      const comment = await this.prisma.$transaction(
        async (tx) => {
          // Check if article exists and is published
          const article = await tx.article.findUnique({
            where: { id: articleId },
            select: { id: true, isPublished: true },
          });

          if (!article) {
            throw new NotFoundException('Article not found');
          }

          if (!article.isPublished) {
            throw new BadRequestException(
              'Cannot comment on unpublished articles',
            );
          }

          // Create comment
          const newComment = await tx.comment.create({
            data: {
              body,
              articleId,
              authorId,
            },
            include: this.getCommentIncludeConfig(),
          });

          // Increment article commentsCount
          await tx.article.update({
            where: { id: articleId },
            data: { commentsCount: { increment: 1 } },
          });

          return newComment;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      // Invalidate caches after successful transaction
      await this.invalidateCommentCaches(articleId);

      this.logger.log(
        `Comment created: id=${comment.id}, articleId=${articleId}, authorId=${authorId}`,
      );

      return this.mapToCommentResponse(comment, false);
    } catch (error) {
      this.logger.error(
        `Failed to create comment: articleId=${articleId}, authorId=${authorId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get paginated list of comments for an article
   * @param articleId - Article ID
   * @param queryDto - Query parameters for pagination
   * @param currentUserId - Current user ID (optional, for following status)
   * @returns Paginated comments
   */
  async findAll(
    articleId: number,
    queryDto: CommentQueryDto,
    currentUserId?: number,
  ): Promise<PaginatedCommentsDto> {
    const { limit, offset } = queryDto;

    try {
      // Batch 1: Check article + count + fetch comments in parallel
      const [article, total, comments] = await Promise.all([
        this.prisma.article.findUnique({
          where: { id: articleId },
          select: { id: true },
        }),
        this.prisma.comment.count({
          where: { articleId },
        }),
        this.prisma.comment.findMany({
          where: { articleId },
          include: this.getCommentIncludeConfig(),
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      if (!article) {
        throw new NotFoundException('Article not found');
      }

      // Batch 2: Get following statuses if needed (only if user authenticated and comments exist)
      let followingMap = new Map<number, boolean>();
      if (currentUserId && comments.length > 0) {
        // Extract unique author IDs (using Set for deduplication)
        const authorIds = [...new Set(comments.map((c) => c.author.id))];

        const followRecords = await this.prisma.follow.findMany({
          where: {
            followerId: currentUserId,
            followingId: { in: authorIds },
          },
          select: { followingId: true },
        });

        // Build map in single pass
        followingMap = new Map(
          followRecords.map((record) => [record.followingId, true]),
        );
      }

      // Map comments to DTOs synchronously
      const commentDtos = comments.map((comment) =>
        this.mapToCommentResponse(
          comment,
          followingMap.get(comment.author.id) ?? false,
        ),
      );

      // Create pagination metadata
      const pagination = this.createPaginationMeta(total, limit, offset);

      return plainToInstance(
        PaginatedCommentsDto,
        {
          comments: commentDtos,
          pagination,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch comments: articleId=${articleId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Get single comment by ID
   * @param commentId - Comment ID
   * @param currentUserId - Current user ID (optional, for following status)
   * @returns Comment
   */
  async findOne(
    commentId: number,
    currentUserId?: number,
  ): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: this.getCommentIncludeConfig(),
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check following status if user is authenticated
    let following = false;
    if (currentUserId) {
      const followCheck = await this.prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: comment.author.id,
        },
        select: { id: true },
      });
      following = !!followCheck;
    }

    return this.mapToCommentResponse(comment, following);
  }

  /**
   * Delete a comment
   * Uses transaction to atomically decrement article.commentsCount
   * @param commentId - Comment ID
   * @returns void
   */
  async delete(commentId: number): Promise<void> {
    try {
      // Use transaction for atomic operations
      await this.prisma
        .$transaction(
          async (tx) => {
            // Get comment to retrieve articleId
            const comment = await tx.comment.findUnique({
              where: { id: commentId },
              select: { id: true, articleId: true },
            });

            if (!comment) {
              throw new NotFoundException('Comment not found');
            }

            // Delete comment
            await tx.comment.delete({
              where: { id: commentId },
            });

            // Decrement article commentsCount
            await tx.article.update({
              where: { id: comment.articleId },
              data: { commentsCount: { decrement: 1 } },
            });

            return comment.articleId;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          },
        )
        .then(async (articleId) => {
          // Invalidate caches after successful transaction
          await this.invalidateCommentCaches(articleId);
        });

      this.logger.log(`Comment deleted: id=${commentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete comment: id=${commentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
