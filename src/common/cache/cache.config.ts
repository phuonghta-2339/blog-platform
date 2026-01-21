/**
 * Cache Configuration Utilities
 *
 * Provides standardized cache keys and TTL constants
 * for consistent caching across the application.
 */

/**
 * Cache Keys Pattern
 * Standardized cache key naming convention
 */
export const CacheKeys = {
  /**
   * User profile cache key
   * @param username - Username
   * @returns Cache key
   */
  userProfile: (username: string) => `profile:${username}`,

  /**
   * User profile pattern for bulk deletion
   * @returns Cache key pattern
   */
  userProfilePattern: () => 'profile:*',

  /**
   * Article cache key
   * @param slug - Article slug
   * @returns Cache key
   */
  article: (slug: string) => `article:${slug}`,

  /**
   * Article list cache key
   * @param page - Page number
   * @param limit - Items per page
   * @returns Cache key
   */
  articleList: (page: number, limit: number) =>
    `articles:page:${page}:limit:${limit}`,

  /**
   * Tag list cache key
   * @returns Cache key
   */
  tagList: () => 'tags:list',
} as const;
