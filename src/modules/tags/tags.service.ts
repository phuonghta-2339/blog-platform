import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Tag } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import { CacheKeys } from '@/common/cache/cache.config';
import { CACHE_TTL } from '@/common/constants/cache';
import { TagResponseDto } from './dto/tag-response.dto';
import {
  TagDetailResponseDto,
  MinimalArticleDto,
} from './dto/tag-detail-response.dto';
import { TAG_DETAIL_ARTICLES_LIMIT } from './constants/tags';

/**
 * Tags Service
 * Handles tag operations with caching for optimal performance
 */
@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Map tag with article count to TagResponseDto
   * @param tag - Tag with _count relation
   * @returns Transformed DTO
   */
  private mapToTagResponse(
    tag: Tag & {
      _count?: {
        articles: number;
      };
    },
  ): TagResponseDto {
    return plainToInstance(
      TagResponseDto,
      {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        articlesCount: tag._count?.articles ?? 0,
        createdAt: tag.createdAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get all tags with article counts
   * Cached for 1 hour (CACHE_TTL.HOUR)
   * @returns List of all tags ordered alphabetically
   */
  async findAll(): Promise<TagResponseDto[]> {
    const cacheKey = CacheKeys.tagList();

    // Try to get from cache
    const cached = await this.cacheManager.get<TagResponseDto[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache miss for ${cacheKey}, fetching from database`);

    // Fetch from database
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    // Transform to DTOs
    const tagDtos = tags.map((tag) => this.mapToTagResponse(tag));

    // Cache the result
    await this.cacheManager.set(cacheKey, tagDtos, CACHE_TTL.HOUR);
    this.logger.debug(
      `Cached ${tagDtos.length} tags with TTL ${CACHE_TTL.HOUR}ms`,
    );

    return tagDtos;
  }

  /**
   * Get tag detail with recent articles
   * Cached for 5 minutes (CACHE_TTL.MEDIUM)
   * @param slug - Tag slug
   * @returns Tag detail with recent articles (limit 20, published only)
   * @throws NotFoundException if tag not found
   */
  async findBySlug(slug: string): Promise<TagDetailResponseDto> {
    const cacheKey = CacheKeys.tagDetail(slug);

    // Try to get from cache
    const cached = await this.cacheManager.get<TagDetailResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache miss for ${cacheKey}, fetching from database`);

    // Fetch tag with articles
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { articles: true },
        },
        articles: {
          take: TAG_DETAIL_ARTICLES_LIMIT,
          orderBy: { createdAt: 'desc' },
          where: {
            article: {
              isPublished: true,
            },
          },
          select: {
            article: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                favoritesCount: true,
                commentsCount: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!tag) {
      this.logger.warn(`Tag not found: ${slug}`);
      throw new NotFoundException(`Tag with slug '${slug}' not found`);
    }

    // Transform articles to MinimalArticleDto
    const articles = tag.articles.map((articleTag) =>
      plainToInstance(
        MinimalArticleDto,
        {
          id: articleTag.article.id,
          slug: articleTag.article.slug,
          title: articleTag.article.title,
          description: articleTag.article.description,
          favoritesCount: articleTag.article.favoritesCount,
          commentsCount: articleTag.article.commentsCount,
          createdAt: articleTag.article.createdAt,
          updatedAt: articleTag.article.updatedAt,
        },
        { excludeExtraneousValues: true },
      ),
    );

    // Transform to DTO
    const tagDetail = plainToInstance(
      TagDetailResponseDto,
      {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        articlesCount: tag._count.articles,
        createdAt: tag.createdAt,
        articles,
      },
      { excludeExtraneousValues: true },
    );

    // Cache the result
    await this.cacheManager.set(cacheKey, tagDetail, CACHE_TTL.MEDIUM);
    this.logger.debug(
      `Cached tag detail '${slug}' with ${articles.length} articles, TTL ${CACHE_TTL.MEDIUM}ms`,
    );

    return tagDetail;
  }

  /**
   * Invalidate tag caches
   * Called when tags or articles are updated
   * @param slug - Optional tag slug to invalidate specific tag detail cache
   */
  async clearCache(slug?: string): Promise<void> {
    const cacheKeys = [CacheKeys.tagList()];

    if (slug) {
      cacheKeys.push(CacheKeys.tagDetail(slug));
      this.logger.debug(`Invalidating cache for tag: ${slug}`);
    } else {
      this.logger.debug('Invalidating all tag list cache');
    }

    await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));
    this.logger.debug(
      `Invalidated ${cacheKeys.length} cache key(s): ${cacheKeys.join(', ')}`,
    );
  }
}
