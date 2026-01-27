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
import { CACHE_TTL } from '@/common/constants/cache';
import { handlePrismaError } from '@/common/helpers/database.helper';
import { SortOrder } from '@common/constants/validation';
import { UsersService } from '@modules/users/users.service';
import { ProfileDto } from './dto/profile.dto';
import { FollowResponseDto } from './dto/follow-response.dto';
import { FollowListQueryDto } from './dto/follow-list-query.dto';
import { PaginatedFollowsDto } from './dto/paginated-follows.dto';

/**
 * Follows Service
 * Handles follow/unfollow operations with caching and batch optimizations
 */
@Injectable()
export class FollowsService {
  private readonly logger = new Logger(FollowsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  /**
   * Map user data to ProfileDto with following status and count
   * @param user - User with _count relation
   * @param following - Whether current user follows this profile
   * @returns ProfileDto instance
   */
  private mapToProfileDto(
    user: {
      username: string;
      bio: string | null;
      avatar: string | null;
      _count?: { followers: number };
    },
    following: boolean,
  ): ProfileDto {
    return plainToInstance(
      ProfileDto,
      {
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        following,
        followersCount: user._count?.followers ?? 0,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Invalidate follow-related caches for a user
   * @param username - Username to invalidate caches for
   */
  private async invalidateFollowCaches(username: string): Promise<void> {
    const cacheKeys = [
      CacheKeys.userProfile(username),
      this.getFollowersCacheKey(username),
      this.getFollowingCacheKey(username),
      this.getFollowedUserIdsCacheKey(username),
    ];

    this.logger.debug(
      `Invalidating ${cacheKeys.length} follow-related cache keys for ${username}`,
    );
    await Promise.all(cacheKeys.map((key) => this.cacheManager.del(key)));
  }

  /**
   * Get cache key for followers list
   * @param username - Username
   * @returns Cache key
   */
  private getFollowersCacheKey(username: string): string {
    return `followers:${username}`;
  }

  /**
   * Get cache key for following list
   * @param username - Username
   * @returns Cache key
   */
  private getFollowingCacheKey(username: string): string {
    return `following:${username}`;
  }

  /**
   * Get cache key for followed user IDs
   * @param username - Username
   * @returns Cache key
   */
  private getFollowedUserIdsCacheKey(username: string): string {
    return `followed_ids:${username}`;
  }

  /**
   * Get cache key for following status check
   * @param followerId - Follower user ID
   * @param followingId - Following user ID
   * @returns Cache key
   */
  private getFollowingStatusCacheKey(
    followerId: number,
    followingId: number,
  ): string {
    return `following_status:${followerId}:${followingId}`;
  }

  /**
   * Follow a user
   * Idempotent operation - safe to call multiple times
   * Prevents self-follow
   * @param currentUserId - Current authenticated user ID
   * @param targetUsername - Username to follow
   * @returns Profile of followed user with updated status
   * @throws NotFoundException if target user not found
   * @throws BadRequestException if trying to follow self
   */
  async followUser(
    currentUserId: number,
    targetUsername: string,
  ): Promise<FollowResponseDto> {
    this.logger.debug(
      `User ${currentUserId} attempting to follow ${targetUsername}`,
    );

    // Find target user
    const targetUser =
      await this.usersService.getUserProfileByUsername(targetUsername);

    if (!targetUser) {
      throw new NotFoundException(`User '${targetUsername}' not found`);
    }

    // Prevent self-follow
    if (currentUserId === targetUser.id) {
      throw new BadRequestException('You cannot follow yourself');
    }

    try {
      // Idempotent create - no error if already exists
      await this.prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      });

      this.logger.debug(
        `User ${currentUserId} followed ${targetUsername} successfully`,
      );
    } catch (error) {
      // If unique constraint violation (already following), continue silently
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.debug(
          `User ${currentUserId} already follows ${targetUsername}, continuing`,
        );
      } else {
        handlePrismaError(
          error as Error,
          'FollowsService.followUser',
          this.logger,
        );
      }
    }

    // Invalidate caches for both users
    const currentUserData =
      await this.usersService.getUsernameById(currentUserId);

    await Promise.all([
      this.invalidateFollowCaches(targetUsername),
      currentUserData
        ? this.invalidateFollowCaches(currentUserData.username)
        : Promise.resolve(),
    ]);

    // Get updated follower count
    const followersCount = await this.prisma.follow.count({
      where: { followingId: targetUser.id },
    });

    const profile = this.mapToProfileDto(
      {
        username: targetUser.username,
        bio: targetUser.bio,
        avatar: targetUser.avatar,
        _count: { followers: followersCount },
      },
      true,
    );

    return plainToInstance(
      FollowResponseDto,
      { profile },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Unfollow a user
   * Idempotent operation - safe to call multiple times
   * @param currentUserId - Current authenticated user ID
   * @param targetUsername - Username to unfollow
   * @returns Profile of unfollowed user with updated status
   * @throws NotFoundException if target user not found
   * @throws BadRequestException if trying to unfollow self
   */
  async unfollowUser(
    currentUserId: number,
    targetUsername: string,
  ): Promise<FollowResponseDto> {
    this.logger.debug(
      `User ${currentUserId} attempting to unfollow ${targetUsername}`,
    );

    // Find target user
    const targetUser =
      await this.usersService.getUserProfileByUsername(targetUsername);

    if (!targetUser) {
      throw new NotFoundException(`User '${targetUsername}' not found`);
    }

    // Prevent self-unfollow (consistency with follow)
    if (currentUserId === targetUser.id) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    try {
      // Idempotent delete - no error if doesn't exist
      await this.prisma.follow.deleteMany({
        where: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      });

      this.logger.debug(
        `User ${currentUserId} unfollowed ${targetUsername} successfully`,
      );
    } catch (error) {
      handlePrismaError(
        error as Error,
        'FollowsService.unfollowUser',
        this.logger,
      );
    }

    // Invalidate caches for both users
    const currentUserData =
      await this.usersService.getUsernameById(currentUserId);

    await Promise.all([
      this.invalidateFollowCaches(targetUsername),
      currentUserData
        ? this.invalidateFollowCaches(currentUserData.username)
        : Promise.resolve(),
    ]);

    // Get updated follower count
    const followersCount = await this.prisma.follow.count({
      where: { followingId: targetUser.id },
    });

    const profile = this.mapToProfileDto(
      {
        username: targetUser.username,
        bio: targetUser.bio,
        avatar: targetUser.avatar,
        _count: { followers: followersCount },
      },
      false,
    );

    return plainToInstance(
      FollowResponseDto,
      { profile },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get followers list for a user
   * @param username - Username to get followers for
   * @param currentUserId - Current user ID (for following status)
   * @param query - Pagination and sorting options
   * @returns Paginated list of follower profiles
   * @throws NotFoundException if user not found
   */
  async getFollowers(
    username: string,
    currentUserId: number,
    query: FollowListQueryDto,
  ): Promise<PaginatedFollowsDto> {
    this.logger.debug(`Getting followers for ${username}`);

    // Verify target user exists
    const targetUser = await this.usersService.getUserIdByUsername(username);

    if (!targetUser) {
      throw new NotFoundException(`User '${username}' not found`);
    }

    // Count total followers
    const total = await this.prisma.follow.count({
      where: { followingId: targetUser.id },
    });

    if (total === 0) {
      return plainToInstance(
        PaginatedFollowsDto,
        {
          profiles: [],
          pagination: {
            total: 0,
            limit: query.limit,
            offset: query.offset,
            hasNext: false,
          },
        },
        { excludeExtraneousValues: true },
      );
    }

    // Get followers with user data
    const follows = await this.prisma.follow.findMany({
      where: { followingId: targetUser.id },
      select: {
        follower: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatar: true,
            _count: {
              select: { followers: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: query.order === SortOrder.ASC ? 'asc' : 'desc',
      },
      skip: query.offset,
      take: query.limit,
    });

    // Extract follower IDs for batch following status check
    const followerIds = follows.map((f) => f.follower.id);

    // Batch check following status
    const followingStatuses = await this.batchCheckFollowing(
      currentUserId,
      followerIds,
    );

    // Map to ProfileDto with following status
    const profiles = follows.map((follow) =>
      this.mapToProfileDto(
        follow.follower,
        followingStatuses[follow.follower.id] ?? false,
      ),
    );

    const hasNext = query.offset + query.limit < total;

    return plainToInstance(
      PaginatedFollowsDto,
      {
        profiles,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasNext,
        },
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Get following list for a user
   * @param username - Username to get following for
   * @param currentUserId - Current user ID (for following status)
   * @param query - Pagination and sorting options
   * @returns Paginated list of following profiles
   * @throws NotFoundException if user not found
   */
  async getFollowing(
    username: string,
    currentUserId: number,
    query: FollowListQueryDto,
  ): Promise<PaginatedFollowsDto> {
    this.logger.debug(`Getting following for ${username}`);

    // Verify target user exists
    const targetUser = await this.usersService.getUserIdByUsername(username);

    if (!targetUser) {
      throw new NotFoundException(`User '${username}' not found`);
    }

    // Count total following
    const total = await this.prisma.follow.count({
      where: { followerId: targetUser.id },
    });

    if (total === 0) {
      return plainToInstance(
        PaginatedFollowsDto,
        {
          profiles: [],
          pagination: {
            total: 0,
            limit: query.limit,
            offset: query.offset,
            hasNext: false,
          },
        },
        { excludeExtraneousValues: true },
      );
    }

    // Get following with user data
    const follows = await this.prisma.follow.findMany({
      where: { followerId: targetUser.id },
      select: {
        following: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatar: true,
            _count: {
              select: { followers: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: query.order === SortOrder.ASC ? 'asc' : 'desc',
      },
      skip: query.offset,
      take: query.limit,
    });

    // Extract following IDs for batch following status check
    const followingIds = follows.map((f) => f.following.id);

    // Batch check following status
    const followingStatuses = await this.batchCheckFollowing(
      currentUserId,
      followingIds,
    );

    // Map to ProfileDto with following status
    const profiles = follows.map((follow) =>
      this.mapToProfileDto(
        follow.following,
        followingStatuses[follow.following.id] ?? false,
      ),
    );

    const hasNext = query.offset + query.limit < total;

    return plainToInstance(
      PaginatedFollowsDto,
      {
        profiles,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasNext,
        },
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Check if current user is following a target user
   * Uses cache for performance
   * @param currentUserId - Current user ID
   * @param targetUserId - Target user ID
   * @returns True if following, false otherwise
   */
  async isFollowing(
    currentUserId: number,
    targetUserId: number,
  ): Promise<boolean> {
    // Check cache first
    const cacheKey = this.getFollowingStatusCacheKey(
      currentUserId,
      targetUserId,
    );
    const cached = await this.cacheManager.get<boolean>(cacheKey);

    if (cached !== undefined && cached !== null) {
      return cached;
    }

    // Query database
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
      select: { id: true },
    });

    const isFollowing = !!follow;

    // Cache result
    await this.cacheManager.set(cacheKey, isFollowing, CACHE_TTL.SHORT);

    return isFollowing;
  }

  /**
   * Get IDs of users that current user is following
   * Used for feed queries
   * Uses cache for performance
   * @param currentUserId - Current user ID
   * @returns Array of user IDs
   */
  async getFollowedUserIds(currentUserId: number): Promise<number[]> {
    const currentUser = await this.usersService.getUsernameById(currentUserId);

    if (!currentUser) {
      return [];
    }

    // Check cache first
    const cacheKey = this.getFollowedUserIdsCacheKey(currentUser.username);
    const cached = await this.cacheManager.get<number[]>(cacheKey);

    if (cached) {
      this.logger.debug(
        `Cache HIT for followed user IDs: ${currentUser.username}`,
      );
      return cached;
    }

    // Query database
    const follows = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const userIds = follows.map((f) => f.followingId);

    // Cache result
    await this.cacheManager.set(cacheKey, userIds, CACHE_TTL.MEDIUM);
    this.logger.debug(
      `Cached followed user IDs for ${currentUser.username}: ${userIds.length} users`,
    );

    return userIds;
  }

  /**
   * Batch check following status for multiple users
   * Optimized to avoid N+1 queries
   * @param currentUserId - Current user ID
   * @param targetUserIds - Array of target user IDs
   * @returns Map of userId -> following status
   */
  async batchCheckFollowing(
    currentUserId: number,
    targetUserIds: number[],
  ): Promise<Record<number, boolean>> {
    if (targetUserIds.length === 0) {
      return {};
    }

    // Single query to get all following relationships
    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: currentUserId,
        followingId: { in: targetUserIds },
      },
      select: { followingId: true },
    });

    // Build lookup map - O(n) instead of O(n²)
    const followingSet = new Set(follows.map((f) => f.followingId));

    // Return record with all target IDs
    const result: Record<number, boolean> = {};
    for (const id of targetUserIds) {
      result[id] = followingSet.has(id);
    }

    return result;
  }
}
