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
import { Prisma, User } from '@prisma/client';
import { hash, compare } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';
import { CacheKeys } from '@/common/cache/cache.config';
import { BCRYPT_SALT_ROUNDS } from '@/common/constants/crypt';
import { CACHE_TTL } from '@/common/constants/cache';
import { handlePrismaError } from '@/common/helpers/database.helper';
import { FollowsService } from '@modules/follows/follows.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PublicProfileDto } from './dto/public-profile.dto';

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
    @Inject(forwardRef(() => FollowsService))
    private readonly followsService: FollowsService,
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
   * Only invalidates public profile cache (username-based)
   * @param username - Current username
   * @param oldUsername - Previous username (if changed)
   */
  private async invalidateUserCaches(
    username: string,
    oldUsername?: string,
  ): Promise<void> {
    const cacheKeys = [CacheKeys.userProfile(username)];

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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserResponse(user);
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
    const { password, currentPassword, ...updateData } = updateUserDto;

    // Check if there are any meaningful fields to update (excluding currentPassword as it's only for verification)
    const hasUpdates = Object.keys(updateData).length > 0 || password;
    if (!hasUpdates) {
      throw new BadRequestException('No fields to update');
    }

    // Security: Require currentPassword for sensitive field changes
    const isSensitiveUpdate =
      updateData.email || updateData.username || password;
    if (isSensitiveUpdate && !currentPassword) {
      throw new BadRequestException(
        'Current password is required to update email, username, or password',
      );
    }

    // Verify currentPassword if provided
    if (currentPassword) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    // Prepare data for update
    const data: Prisma.UserUpdateInput = { ...updateData };

    // Hash password if provided
    if (password) {
      data.password = await hash(password, BCRYPT_SALT_ROUNDS);
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
        where: { id: userId },
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

      // Verify user is still active after update
      if (!user.isActive) {
        throw new NotFoundException('User not found');
      }

      // Invalidate cache AFTER successful database update to prevent race condition
      if (updateData.username) {
        await this.invalidateUserCaches(user.username, oldUser?.username);
      }

      return this.mapToUserResponse(user);
    } catch (error) {
      // Handle unique constraint violations for better user messages
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

      // Use centralized error handler for other Prisma errors
      handlePrismaError(error as Error, 'updateProfile', this.logger);
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
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        isActive: true,
        _count: {
          select: {
            followers: true,
            articles: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException(`User with username '${username}' not found`);
    }

    // Check if current user is following this profile
    let following = false;
    if (currentUserId && currentUserId !== user.id) {
      following = await this.followsService.isFollowing(currentUserId, user.id);
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
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user?.isActive ? user : null;
  }

  /**
   * Find user by email (helper method)
   * Only returns active users
   * @param email - User email
   * @returns User entity or null if not found/inactive
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user?.isActive ? user : null;
  }

  /**
   * Find user by username (helper method)
   * Only returns active users
   * @param username - Username
   * @returns User entity or null if not found/inactive
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return user?.isActive ? user : null;
  }

  /**
   * Get user profile fields by username
   * Optimized for follows and profile operations - only fetches needed fields
   * @param username - Username to look up
   * @returns User profile fields or null if not found/inactive
   */
  async getUserProfileByUsername(username: string): Promise<{
    id: number;
    username: string;
    bio: string | null;
    avatar: string | null;
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        isActive: true,
      },
    });
    return user?.isActive ? user : null;
  }

  /**
   * Get user ID by username
   * Lightweight query for operations that only need to verify user exists
   * @param username - Username to look up
   * @returns User ID object or null if not found/inactive
   */
  async getUserIdByUsername(username: string): Promise<{ id: number } | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, isActive: true },
    });
    return user?.isActive ? { id: user.id } : null;
  }

  /**
   * Get username by user ID
   * Lightweight query for cache key generation and logging
   * @param userId - User ID to look up
   * @returns Username object or null if not found/inactive
   */
  async getUsernameById(userId: number): Promise<{ username: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, isActive: true },
    });
    return user?.isActive ? { username: user.username } : null;
  }
}
