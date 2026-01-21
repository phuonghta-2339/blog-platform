import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import { CacheKeys } from '@/common/cache/cache.config';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PublicProfileDto } from './dto/public-profile.dto';
import { CACHE_TTL } from '@/common/constants/cache';

/**
 * Users Service
 * Handles user profile management operations
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Map user with counts to UserResponseDto
   * Ensures all count fields have default values (0) if not provided
   * @param user - User with _count relation
   * @returns Transformed DTO with guaranteed count fields
   */
  private mapToUserResponse(
    user: User & {
      _count?: {
        followers: number;
        following: number;
        articles: number;
      };
    },
  ): UserResponseDto {
    return plainToInstance(
      UserResponseDto,
      {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        followersCount: user._count?.followers ?? 0,
        followingCount: user._count?.following ?? 0,
        articlesCount: user._count?.articles ?? 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Invalidate all caches related to a user
   * @param userId - User ID
   * @param username - Current username
   * @param oldUsername - Previous username (if changed)
   */
  private async invalidateUserCaches(
    userId: number,
    username: string,
    oldUsername?: string,
  ): Promise<void> {
    const cacheKeys = [
      `user:${userId}:profile`,
      CacheKeys.userProfile(username),
    ];

    // If username changed, also invalidate old username cache
    if (oldUsername && oldUsername !== username) {
      cacheKeys.push(CacheKeys.userProfile(oldUsername));
      this.logger.debug(
        `Username changed from ${oldUsername} to ${username}, invalidating both caches`,
      );
    }

    this.logger.debug(
      `Invalidating ${cacheKeys.length} cache key(s): ${cacheKeys.join(', ')}`,
    );
    await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));
  }

  /**
   * Get current user profile with aggregated counts
   * @param userId - Authenticated user ID
   * @returns User profile with stats
   * @throws NotFoundException if user not found or inactive
   */
  async getProfile(userId: number): Promise<UserResponseDto> {
    // Try cache first for performance (SHORT TTL for authenticated data)
    const cacheKey = `user:${userId}:profile`;
    const cached = await this.cacheManager.get<UserResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for user profile: ${userId}`);
      return cached;
    }

    this.logger.debug(`Cache miss for user profile: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            articles: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = this.mapToUserResponse(user);

    // Cache authenticated user profile with SHORT TTL (60s)
    await this.cacheManager.set(cacheKey, profile, CACHE_TTL.SHORT);

    return profile;
  }

  /**
   * Update current user profile
   * @param userId - Authenticated user ID
   * @param updateUserDto - Fields to update
   * @returns Updated user profile
   * @throws NotFoundException if user not found
   * @throws BadRequestException if username/email already taken or no fields to update
   */
  async updateProfile(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Check if there are any fields to update (before any processing)
    if (Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const { password, ...updateData } = updateUserDto;

    // Prepare data for update
    const data: Prisma.UserUpdateInput = { ...updateData };

    // Hash password if provided
    if (password) {
      data.password = await hash(password, 10);
    }

    try {
      // Get old username before update for cache invalidation
      const oldUser = updateData.username
        ? await this.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true },
          })
        : null;

      const user = await this.prisma.user.update({
        where: { id: userId, isActive: true },
        data,
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
              articles: true,
            },
          },
        },
      });

      // Invalidate all related caches
      await this.invalidateUserCaches(userId, user.username, oldUser?.username);

      return this.mapToUserResponse(user);
    } catch (error) {
      // Handle unique constraint violations
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[] | undefined;

        if (target?.includes('email')) {
          throw new BadRequestException('Email already registered');
        }

        if (target?.includes('username')) {
          throw new BadRequestException('Username already taken');
        }

        throw new BadRequestException('Update failed: duplicate entry');
      }

      // Handle record not found (P2025)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get public profile by username
   * @param username - Username to look up
   * @param currentUserId - Optional current user ID to check following status
   * @returns Public profile with stats
   * @throws NotFoundException if user not found or inactive
   * @throws BadRequestException if username is invalid
   */
  async getPublicProfile(
    username: string,
    currentUserId?: number,
  ): Promise<PublicProfileDto> {
    // Validate username parameter
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }

    // Try to get from cache (only for non-authenticated or own profile views)
    const cacheKey = CacheKeys.userProfile(username);
    if (!currentUserId) {
      const cached = await this.cacheManager.get<PublicProfileDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for public profile: ${username}`);
        return cached;
      }
      this.logger.debug(`Cache miss for public profile: ${username}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { username, isActive: true },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        _count: {
          select: {
            followers: true,
            articles: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with username '${username}' not found`);
    }

    // Check if current user is following this profile
    let following = false;
    if (currentUserId && currentUserId !== user.id) {
      const followRecord = await this.prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: user.id,
        },
      });
      following = !!followRecord;
    }

    const profile = plainToInstance(
      PublicProfileDto,
      {
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user._count.followers,
        articlesCount: user._count.articles,
        following,
      },
      { excludeExtraneousValues: true },
    );

    // Cache only for non-authenticated views
    if (!currentUserId) {
      await this.cacheManager.set(cacheKey, profile, CACHE_TTL.MEDIUM);
    }

    return profile;
  }

  /**
   * Find user by ID (helper method)
   * Only returns active users
   * @param id - User ID
   * @returns User entity or null if not found/inactive
   */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, isActive: true },
    });
  }

  /**
   * Find user by email (helper method)
   * Only returns active users
   * @param email - User email
   * @returns User entity or null if not found/inactive
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email, isActive: true },
    });
  }

  /**
   * Find user by username (helper method)
   * Only returns active users
   * @param username - Username
   * @returns User entity or null if not found/inactive
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username, isActive: true },
    });
  }
}
