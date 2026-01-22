import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Article, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import { CacheKeys } from '@/common/cache/cache.config';
import { slugify, generateUniqueSlug } from '@/common/helpers/slug.helper';
import { ARTICLE_TITLE_MAX_LENGTH } from '@/common/constants/validation';
import { TagsService } from '@modules/tags/tags.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import {
  ArticleQueryDto,
  ArticleSortBy,
  SortOrder,
} from './dto/article-query.dto';
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
  ) {}

  /**
   * Generate unique slug from title
   * Checks for duplicates and adds timestamp suffix if needed
   * @param title - Article title
   * @returns Unique slug
   */
  private async generateUniqueSlugFromTitle(title: string): Promise<string> {
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 0;

    // Check for duplicates and generate unique slug
    while (await this.prisma.article.findUnique({ where: { slug } })) {
      slug = generateUniqueSlug(baseSlug, counter, ARTICLE_TITLE_MAX_LENGTH);
      counter++;
    }

    return slug;
  }

  /**
   * Map article with relations to ArticleResponseDto
   * @param article - Article with relations
   * @param currentUserId - Current user ID (optional, for favorited/following status)
   * @returns Transformed DTO
   */
  private mapToArticleResponse(
    article: Article & {
      author: {
        id: number;
        username: string;
        bio: string | null;
        avatar: string | null;
      };
      tags: Array<{
        tag: {
          id: number;
          name: string;
          slug: string;
        };
      }>;
      favorites?: Array<{ userId: number }>;
      _count?: {
        favorites: number;
        comments: number;
      };
    },
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
   * Invalidate article caches
   * @param slug - Article slug
   */
  private async invalidateArticleCaches(slug?: string): Promise<void> {
    const cacheKeys: string[] = [];

    if (slug) {
      cacheKeys.push(CacheKeys.article(slug));
    }

    // Invalidate all article list caches
    await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));

    this.logger.debug(`Invalidated ${cacheKeys.length} article cache keys`);
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

    // Generate unique slug
    const articleSlug = await this.generateUniqueSlugFromTitle(title);

    try {
      // Use transaction for atomic operations
      const result = await this.prisma.$transaction(
        async (tx) => {
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
            include: {
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
              _count: {
                select: {
                  favorites: true,
                  comments: true,
                },
              },
            },
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
              include: {
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
                _count: {
                  select: {
                    favorites: true,
                    comments: true,
                  },
                },
              },
            });

            return articleWithTags!;
          }

          return article;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      // Invalidate caches outside transaction
      await Promise.all([
        this.invalidateArticleCaches(articleSlug),
        this.tagsService.clearCache(),
      ]);

      this.logger.log(`Created article: ${articleSlug}`);
      return this.mapToArticleResponse(result, authorId);
    } catch (error) {
      this.logger.error(
        `Failed to create article: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to create article');
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
          include: {
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
            favorites: currentUserId
              ? {
                  where: { userId: currentUserId },
                  select: { userId: true },
                }
              : false,
            _count: {
              select: {
                favorites: true,
                comments: true,
              },
            },
          },
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
          article,
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
      this.logger.error(
        `Failed to fetch articles: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to fetch articles');
    }
  }

  /**
   * Get personal feed from followed users
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
      // Get followed user IDs with minimal select
      const followings = await this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });

      const followedUserIds = followings.map((f) => f.followingId);

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
          include: {
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
            favorites: {
              where: { userId },
              select: { userId: true },
            },
            _count: {
              select: {
                favorites: true,
                comments: true,
              },
            },
          },
        }),
      ]);

      // All authors are followed (by definition)
      const articleDtos = articles.map((article) =>
        this.mapToArticleResponse(article, userId, true),
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
      this.logger.error(
        `Failed to fetch feed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to fetch feed');
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
        include: {
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
          favorites: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { userId: true },
              }
            : false,
          _count: {
            select: {
              favorites: true,
              comments: true,
            },
          },
        },
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

      return this.mapToArticleResponse(article, currentUserId, isFollowing);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch article: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to fetch article');
    }
  }

  /**
   * Update article by id
   * @param id - Article id
   * @param updateDto - Update data
   * @param userId - Current user ID
   * @returns Updated article
   */
  async update(
    id: number,
    updateDto: UpdateArticleDto,
    userId: number,
  ): Promise<ArticleResponseDto> {
    const { title, description, body, tagList, isPublished } = updateDto;

    try {
      // Generate new slug if title changed
      let newSlug: string | undefined;
      if (title) {
        newSlug = await this.generateUniqueSlugFromTitle(title);
      }

      const result = await this.prisma.$transaction(
        async (tx) => {
          // Build update data
          const updateData: Prisma.ArticleUpdateInput = {};
          if (title && newSlug) {
            updateData.title = title;
            updateData.slug = newSlug;
          }
          if (description !== undefined) updateData.description = description;
          if (body !== undefined) updateData.body = body;
          if (isPublished !== undefined) updateData.isPublished = isPublished;

          // Update article using id
          const article = await tx.article.update({
            where: { id },
            data: updateData,
            include: {
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
              _count: {
                select: {
                  favorites: true,
                  comments: true,
                },
              },
            },
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

          return article;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      // Invalidate caches outside transaction
      await Promise.all([
        this.invalidateArticleCaches(result.slug),
        newSlug ? this.invalidateArticleCaches(newSlug) : Promise.resolve(),
        this.tagsService.clearCache(),
      ]);

      this.logger.log(`Updated article id=${id}, slug=${result.slug}`);

      return this.mapToArticleResponse(result, userId);
    } catch (error) {
      this.logger.error(
        `Failed to update article: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to update article');
    }
  }

  /**
   * Delete article by id
   * @param id - Article id
   * @param slug - Article slug (for cache invalidation)
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
      this.logger.error(
        `Failed to delete article: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('Failed to delete article');
    }
  }
}
