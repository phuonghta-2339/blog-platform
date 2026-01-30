import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import { CacheKeys } from '@/common/cache/cache.config';
import { slugify, generateUniqueSlug } from '@/common/helpers/slug.helper';
import { hasAtLeastOneField } from '@/common/helpers/validation.helper';
import { handlePrismaError } from '@/common/helpers/database.helper';
import { deleteCacheByPattern } from '@/common/helpers/cache.helper';
import { MAX_QUERY_RETRIES } from '@/common/constants/database';
import {
  ARTICLE_TITLE_MAX_LENGTH,
  ARTICLE_UPDATABLE_FIELDS,
  SortOrder,
} from '@/common/constants/validation';
import { TagsService } from '@modules/tags/tags.service';
import { FollowsService } from '@modules/follows/follows.service';
import { ArticleWithRelations } from './types/article-with-relations.type';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto, ArticleSortBy } from './dto/article-query.dto';
import {
  ArticleResponseDto,
  ArticleTagDto,
  ArticleAuthorDto,
} from './dto/article-response.dto';
import {
  PaginatedArticlesDto,
  PaginationMetaDto,
} from './dto/paginated-articles.dto';

/**
 * Articles Service
 * Handles CRUD operations for articles with caching, pagination, and tag coordination
 */
@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly tagsService: TagsService,
    @Inject(forwardRef(() => FollowsService))
    private readonly followsService: FollowsService,
  ) {}

  /**
   * Get reusable article include configuration
   * Extracts common query patterns for consistent article fetching with relations
   * @param userId - Optional current user ID for favorited status filtering
   * @returns Prisma include configuration for article queries
   */
  private getArticleIncludeConfig(userId?: number): Prisma.ArticleInclude {
    return {
      author: {
        select: {
          id: true,
          username: true,
          bio: true,
          avatar: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      favorites: userId
        ? {
            where: { userId },
            select: { userId: true },
          }
        : false,
      _count: {
        select: {
          favorites: true,
          comments: true,
        },
      },
    };
  }

  /**
   * Validate article exists by ID (minimal validation)
   * Specialized method for quick existence checks
   * @param articleId - Article ID
   * @param tx - Optional transaction client
   * @throws NotFoundException if article not found
   */
  async validateArticleExistsById(
    articleId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;

    const article = await client.article.findUnique({
      where: { id: articleId },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }
  }

  /**
   * Validate article exists and is published by ID
   * Specialized method for operations requiring published articles
   * @param articleId - Article ID
   * @param tx - Optional transaction client
   * @throws NotFoundException if article not found
   * @throws BadRequestException if article is not published
   */
  async validateArticlePublishedById(
    articleId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;

    const article = await client.article.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        isPublished: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (!article.isPublished) {
      throw new BadRequestException(
        'Cannot perform operation on unpublished articles',
      );
    }
  }

  /**
   * Get article summary fields by ID
   * Returns commonly needed fields for favorite/comment operations
   * @param articleId - Article ID
   * @param tx - Optional transaction client
   * @returns Article with slug, title, and favoritesCount
   * @throws NotFoundException if article not found
   */
  async getArticleSummaryById(
    articleId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<{ slug: string; title: string; favoritesCount: number }> {
    const client = tx || this.prisma;

    const article = await client.article.findUnique({
      where: { id: articleId },
      select: {
        slug: true,
        title: true,
        favoritesCount: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  /**
   * Generate unique slug within transaction with retry logic
   * Handles concurrent slug generation by retrying on unique constraint violation
   * @param tx - Prisma transaction client
   * @param title - Article title
   * @returns Unique slug
   */
  private async generateUniqueSlugInTransaction(
    tx: Prisma.TransactionClient,
    title: string,
  ): Promise<string> {
    let baseSlug: string;

    try {
      baseSlug = slugify(title);
    } catch (error) {
      // Handle invalid title that produces empty slug (e.g., "🎉🎊", "!!!@@@")
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Invalid title: cannot generate slug from the provided title',
      );
    }

    let slug = baseSlug;
    let counter = 0;

    // Check for duplicates and generate unique slug within transaction
    while (counter < MAX_QUERY_RETRIES) {
      const existing = await tx.article.findUnique({ where: { slug } });
      if (!existing) {
        return slug;
      }
      slug = generateUniqueSlug(baseSlug, counter, ARTICLE_TITLE_MAX_LENGTH);
      counter++;
    }

    throw new BadRequestException(
      `Unable to generate unique slug for title after ${MAX_QUERY_RETRIES} attempts`,
    );
  }

  /**
   * Map article with relations to ArticleResponseDto
   * @param article - Article with relations
   * @param currentUserId - Current user ID (optional, for favorited/following status)
   * @returns Transformed DTO
   */
  private mapToArticleResponse(
    article: ArticleWithRelations,
    currentUserId?: number,
    isFollowingAuthor?: boolean,
  ): ArticleResponseDto {
    // Map tags
    const tags = article.tags.map((at) =>
      plainToInstance(
        ArticleTagDto,
        {
          id: at.tag.id,
          name: at.tag.name,
          slug: at.tag.slug,
        },
        { excludeExtraneousValues: true },
      ),
    );

    // Map author
    const author = plainToInstance(
      ArticleAuthorDto,
      {
        id: article.author.id,
        username: article.author.username,
        bio: article.author.bio,
        avatar: article.author.avatar,
        following: isFollowingAuthor ?? false,
      },
      { excludeExtraneousValues: true },
    );

    // Check if current user favorited this article
    const favorited =
      currentUserId && article.favorites ? article.favorites.length > 0 : false;

    return plainToInstance(
      ArticleResponseDto,
      {
        id: article.id,
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tags,
        author,
        favoritesCount: article._count?.favorites ?? article.favoritesCount,
        commentsCount: article._count?.comments ?? article.commentsCount,
        favorited,
        isPublished: article.isPublished,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
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
   * Invalidate article-related caches
   * Clears both individual article cache and all article list/pagination caches
   * This ensures that when articles are created, updated, or deleted,
   * both direct article access and list pages show fresh data
   * @param slug - Specific article slug to invalidate (optional)
   */
  private async invalidateArticleCaches(slug?: string): Promise<void> {
    const cacheInvalidations: Promise<void>[] = [];

    // Always invalidate all article list caches when any article changes
    // This includes pagination, filtering, sorting results
    cacheInvalidations.push(
      (async () => {
        const deletedCount = await deleteCacheByPattern(
          this.cacheManager,
          'article*',
          this.logger,
        );

        if (deletedCount > 0) {
          this.logger.debug(
            `Invalidated ${deletedCount} article list cache keys`,
          );
        }
      })(),
    );

    // Invalidate specific article cache if slug provided
    if (slug) {
      cacheInvalidations.push(
        (async () => {
          await this.cacheManager.del(CacheKeys.article(slug));
          this.logger.debug(`Invalidated cache for article slug: ${slug}`);
        })(),
      );
    }

    await Promise.all(cacheInvalidations);
  }

  /**
   * Create a new article
   * @param createDto - Article creation data
   * @param authorId - Author user ID
   * @returns Created article
   */
  async create(
    createDto: CreateArticleDto,
    authorId: number,
  ): Promise<ArticleResponseDto> {
    const {
      title,
      description,
      body,
      tagList = [],
      isPublished = true,
    } = createDto;

    try {
      // Use transaction for atomic operations including slug generation
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Generate unique slug within transaction to avoid race conditions
          const articleSlug = await this.generateUniqueSlugInTransaction(
            tx,
            title,
          );

          // Create article
          const article = await tx.article.create({
            data: {
              slug: articleSlug,
              title,
              description,
              body,
              authorId,
              isPublished,
            },
            include: this.getArticleIncludeConfig(authorId),
          });

          // Connect tags if provided
          if (tagList.length > 0) {
            // Find existing tags only (skip invalid tags)
            const existingTags = await tx.tag.findMany({
              where: {
                slug: { in: tagList },
              },
              select: { id: true },
            });

            // Only create relations if there are valid tags
            if (existingTags.length > 0) {
              await tx.articleTag.createMany({
                data: existingTags.map((tag) => ({
                  articleId: article.id,
                  tagId: tag.id,
                })),
              });
            }

            // Fetch article with tags
            const articleWithTags = await tx.article.findUnique({
              where: { id: article.id },
              include: this.getArticleIncludeConfig(authorId),
            });

            if (!articleWithTags) {
              throw new Error(
                'Failed to fetch created article with tags - transaction will rollback',
              );
            }

            return articleWithTags;
          }

          return article;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      // Invalidate caches outside transaction
      await Promise.all([
        this.invalidateArticleCaches(result.slug),
        this.tagsService.clearCache(),
      ]);

      this.logger.log(`Created article: ${result.slug}`);
      return this.mapToArticleResponse(
        result as unknown as ArticleWithRelations,
        authorId,
      );
    } catch (error) {
      handlePrismaError(error as Error, 'create', this.logger);
    }
  }

  /**
   * Find all articles with filters and pagination
   * @param query - Query parameters
   * @param currentUserId - Current user ID (optional)
   * @returns Paginated articles
   */
  async findAll(
    query: ArticleQueryDto,
    currentUserId?: number,
  ): Promise<PaginatedArticlesDto> {
    const {
      tag,
      author,
      favorited,
      limit = 20,
      offset = 0,
      sortBy = ArticleSortBy.CREATED_AT,
      order = SortOrder.DESC,
    } = query;

    // Build where clause
    const where: Prisma.ArticleWhereInput = {
      isPublished: true,
    };

    // Filter by tag
    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }

    // Filter by author
    if (author) {
      where.author = {
        username: author,
      };
    }

    // Filter by favorited user
    if (favorited) {
      where.favorites = {
        some: {
          user: {
            username: favorited,
          },
        },
      };
    }

    // Build orderBy
    const orderBy: Prisma.ArticleOrderByWithRelationInput = {};
    if (sortBy === ArticleSortBy.CREATED_AT) {
      orderBy.createdAt = order;
    } else if (sortBy === ArticleSortBy.FAVORITES_COUNT) {
      orderBy.favoritesCount = order;
    } else if (sortBy === ArticleSortBy.COMMENTS_COUNT) {
      orderBy.commentsCount = order;
    }

    try {
      // Get total count and articles in parallel
      const [total, articles] = await Promise.all([
        this.prisma.article.count({ where }),
        this.prisma.article.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          include: this.getArticleIncludeConfig(currentUserId),
        }),
      ]);

      // Get following status if user is authenticated and articles exist
      let followingMap: Map<number, boolean> = new Map();
      if (currentUserId && articles.length > 0) {
        const authorIds = articles.map((a) => a.author.id);
        const followings = await this.prisma.follow.findMany({
          where: {
            followerId: currentUserId,
            followingId: { in: authorIds },
          },
          select: { followingId: true },
        });
        followingMap = new Map(followings.map((f) => [f.followingId, true]));
      }

      // Map to DTOs
      const articleDtos = articles.map((article) =>
        this.mapToArticleResponse(
          article as unknown as ArticleWithRelations,
          currentUserId,
          followingMap.get(article.author.id) ?? false,
        ),
      );

      const pagination = this.createPaginationMeta(total, limit, offset);

      return plainToInstance(
        PaginatedArticlesDto,
        {
          articles: articleDtos,
          pagination,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      handlePrismaError(error as Error, 'findAll', this.logger);
    }
  }

  /**
   * Get personal feed from followed users
   * Uses FollowsService for cached followed user IDs
   * @param userId - Current user ID
   * @param limit - Items per page
   * @param offset - Items to skip
   * @returns Paginated articles from followed users
   */
  async getFeed(
    userId: number,
    limit = 20,
    offset = 0,
  ): Promise<PaginatedArticlesDto> {
    try {
      // Get followed user IDs (cached in FollowsService)
      const followedUserIds =
        await this.followsService.getFollowedUserIds(userId);

      // Early return if no followings - saves 2 expensive queries
      if (followedUserIds.length === 0) {
        return plainToInstance(
          PaginatedArticlesDto,
          {
            articles: [],
            pagination: this.createPaginationMeta(0, limit, offset),
          },
          { excludeExtraneousValues: true },
        );
      }

      const where: Prisma.ArticleWhereInput = {
        isPublished: true,
        authorId: { in: followedUserIds },
      };

      // Parallel queries for count and articles
      const [total, articles] = await Promise.all([
        this.prisma.article.count({ where }),
        this.prisma.article.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          include: this.getArticleIncludeConfig(userId),
        }),
      ]);

      // All authors are followed (by definition)
      const articleDtos = articles.map((article) =>
        this.mapToArticleResponse(
          article as unknown as ArticleWithRelations,
          userId,
          true,
        ),
      );

      const pagination = this.createPaginationMeta(total, limit, offset);

      return plainToInstance(
        PaginatedArticlesDto,
        {
          articles: articleDtos,
          pagination,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      handlePrismaError(error as Error, 'getFeed', this.logger);
    }
  }

  /**
   * Get single article by slug
   * @param slug - Article slug
   * @param currentUserId - Current user ID (optional)
   * @returns Article details
   * @throws NotFoundException if article not found
   */
  async findOne(
    slug: string,
    currentUserId?: number,
  ): Promise<ArticleResponseDto> {
    try {
      const article = await this.prisma.article.findUnique({
        where: { slug },
        include: this.getArticleIncludeConfig(currentUserId),
      });

      if (!article) {
        throw new NotFoundException(`Article with slug "${slug}" not found`);
      }

      // Check if user follows the author
      let isFollowing = false;
      if (currentUserId && currentUserId !== article.author.id) {
        const follow = await this.prisma.follow.findFirst({
          where: {
            followerId: currentUserId,
            followingId: article.author.id,
          },
        });
        isFollowing = !!follow;
      }

      return this.mapToArticleResponse(
        article as unknown as ArticleWithRelations,
        currentUserId,
        isFollowing,
      );
    } catch (error) {
      handlePrismaError(error as Error, 'findOne', this.logger);
    }
  }

  /**
   * Update article by id
   * @param id - Article id
   * @param updateDto - Update data
   * @param userId - Current user ID
   * @returns Updated article
   * @throws BadRequestException if no fields are provided for update
   */
  async update(
    id: number,
    updateDto: UpdateArticleDto,
    userId: number,
  ): Promise<ArticleResponseDto> {
    const { title, description, body, tagList, isPublished } = updateDto;

    // Validate that at least one field is provided for update
    if (!hasAtLeastOneField(updateDto, ARTICLE_UPDATABLE_FIELDS)) {
      throw new BadRequestException(
        `At least one field (${ARTICLE_UPDATABLE_FIELDS.join(', ')}) must be provided for update`,
      );
    }

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Fetch current article to get old slug before update
          const currentArticle = await tx.article.findUnique({
            where: { id },
            select: { slug: true },
          });

          if (!currentArticle) {
            throw new NotFoundException(`Article with id ${id} not found`);
          }

          const oldSlug = currentArticle.slug;

          // Build update data
          const updateData: Prisma.ArticleUpdateInput = {};

          // Generate new slug if title changed (within transaction for atomicity)
          if (title) {
            // Generate base slug from new title
            let baseSlug: string;
            try {
              baseSlug = slugify(title);
            } catch (error) {
              throw new BadRequestException(
                error instanceof Error
                  ? error.message
                  : 'Invalid title: cannot generate slug from the provided title',
              );
            }

            // Only regenerate slug if base slug differs from current slug
            // This prevents unnecessary slug changes when updating with same/similar title
            if (baseSlug !== oldSlug) {
              const newSlug = await this.generateUniqueSlugInTransaction(
                tx,
                title,
              );
              updateData.slug = newSlug;
            }
            // Always update title even if slug stays the same
            updateData.title = title;
          }
          if (description !== undefined) updateData.description = description;
          if (body !== undefined) updateData.body = body;
          if (isPublished !== undefined) updateData.isPublished = isPublished;

          // Update article using id
          const article = await tx.article.update({
            where: { id },
            data: updateData,
            include: this.getArticleIncludeConfig(userId),
          });

          // Update tags if provided
          if (tagList !== undefined) {
            // Delete existing tags
            await tx.articleTag.deleteMany({
              where: { articleId: article.id },
            });

            if (tagList.length > 0) {
              // Find existing tags only (skip invalid tags)
              const existingTags = await tx.tag.findMany({
                where: {
                  slug: { in: tagList },
                },
                select: { id: true },
              });

              // Create relations if valid tags exist
              if (existingTags.length > 0) {
                await tx.articleTag.createMany({
                  data: existingTags.map((tag) => ({
                    articleId: article.id,
                    tagId: tag.id,
                  })),
                });

                // Refetch only tags relation (article data unchanged)
                const updatedTags = await tx.articleTag.findMany({
                  where: { articleId: article.id },
                  include: {
                    tag: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                });

                // Update article.tags in memory
                article.tags = updatedTags;
              } else {
                // No valid tags, clear tags array
                article.tags = [];
              }
            } else {
              // Empty tagList, clear tags
              article.tags = [];
            }
          }

          // Return old slug for cache invalidation
          return { article, oldSlug };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      // Invalidate caches outside transaction
      const { article, oldSlug } = result;
      const cacheInvalidations: Promise<void>[] = [
        this.tagsService.clearCache(),
      ];

      // Always invalidate old slug cache
      cacheInvalidations.push(this.invalidateArticleCaches(oldSlug));

      // Invalidate new slug cache if it changed
      if (article.slug !== oldSlug) {
        cacheInvalidations.push(this.invalidateArticleCaches(article.slug));
      }

      await Promise.all(cacheInvalidations);

      this.logger.log(`Updated article id=${id}, slug=${article.slug}`);

      return this.mapToArticleResponse(
        article as unknown as ArticleWithRelations,
        userId,
      );
    } catch (error) {
      handlePrismaError(error as Error, 'update', this.logger);
    }
  }

  /**
   * Delete article by id
   * @param id - Article id
   * @param slug - Article slug (for cache invalidation)
   * @throws NotFoundException if article doesn't exist
   * @throws InternalServerErrorException for unexpected errors
   */
  async delete(id: number, slug: string): Promise<void> {
    try {
      // Delete using id (cascade handles relations)
      await this.prisma.article.delete({
        where: { id },
      });

      // Invalidate caches
      await Promise.all([
        this.invalidateArticleCaches(slug),
        this.tagsService.clearCache(),
      ]);

      this.logger.log(`Deleted article id=${id}, slug=${slug}`);
    } catch (error) {
      handlePrismaError(error as Error, 'delete', this.logger);
    }
  }

  /**
   * Get top articles by favorites count (for reports)
   * @param limit - Number of articles to fetch
   * @returns List of top articles with basic stats
   */
  async getTopLikedArticles(
    limit: number,
  ): Promise<{ id: number; title: string; favoritesCount: number }[]> {
    try {
      return await this.prisma.article.findMany({
        orderBy: { favoritesCount: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          favoritesCount: true,
        },
      });
    } catch (error) {
      handlePrismaError(error as Error, 'getTopLikedArticles', this.logger);
      return []; // Should depend on handlePrismaError, currently unreachable if it throws
    }
  }
}
