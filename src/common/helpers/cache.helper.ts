/**
 * Cache operation helpers
 * Provides reusable utilities for advanced cache operations
 */

import { Cache } from 'cache-manager';
import { Logger } from '@nestjs/common';
import { CacheStoreWithPattern } from '@common/interfaces/cache.interface';

/**
 * Delete cache keys matching a pattern using Redis client
 * Safely handles pattern-based deletion with fallback
 *
 * @param cacheManager - Cache manager instance
 * @param pattern - Glob pattern for keys to delete (e.g., 'article*')
 * @param logger - Logger instance for warnings
 * @returns Number of keys deleted, or 0 if operation fails
 */
export async function deleteCacheByPattern(
  cacheManager: Cache,
  pattern: string,
  logger?: Logger,
): Promise<number> {
  try {
    const store = (cacheManager as unknown as { store: CacheStoreWithPattern })
      .store;

    // Verify store has Redis client capabilities
    if (!store?.client || typeof store.client.keys !== 'function') {
      logger?.warn(
        `Pattern-based cache deletion not supported for pattern "${pattern}"`,
      );
      return 0;
    }

    const keys = await store.client.keys(pattern);

    if (!Array.isArray(keys) || keys.length === 0) {
      return 0;
    }

    await store.client.del(...keys);
    return keys.length;
  } catch (error) {
    logger?.warn(
      `Pattern-based cache deletion failed for pattern "${pattern}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return 0;
  }
}

/**
 * Invalidate multiple cache keys in parallel
 * Efficiently clears multiple cache entries at once
 *
 * @param cacheManager - Cache manager instance
 * @param keys - Array of cache keys to invalidate
 * @returns Promise that resolves when all keys are deleted
 */
export async function invalidateMultipleCaches(
  cacheManager: Cache,
  keys: string[],
): Promise<void> {
  await Promise.all(keys.map((key) => cacheManager.del(key)));
}

/**
 * Clear cache with pattern and log result
 * Combines pattern deletion with logging for better observability
 *
 * @param cacheManager - Cache manager instance
 * @param pattern - Glob pattern for keys to delete
 * @param logger - Logger instance
 * @param logMessage - Optional custom log message
 * @returns Number of keys deleted
 */
export async function clearCacheWithLog(
  cacheManager: Cache,
  pattern: string,
  logger: Logger,
  logMessage?: string,
): Promise<number> {
  const deletedCount = await deleteCacheByPattern(
    cacheManager,
    pattern,
    logger,
  );

  if (deletedCount > 0) {
    logger.debug(
      logMessage ??
        `Invalidated ${deletedCount} cache keys for pattern: ${pattern}`,
    );
  }

  return deletedCount;
}
