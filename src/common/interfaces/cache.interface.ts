/**
 * Cache-related interfaces and types
 * Provides type definitions for cache store operations
 */

/**
 * Interface for Redis-compatible cache store with pattern matching capabilities
 * Used for advanced cache operations like bulk deletion by pattern
 */
export interface CacheStoreWithPattern {
  client?: {
    /**
     * Get all keys matching a pattern (Redis KEYS command)
     * @param pattern - Glob-style pattern (e.g., 'article*')
     * @returns Promise resolving to array of matching keys
     */
    keys: (pattern: string) => Promise<string[]>;

    /**
     * Delete one or more keys (Redis DEL command)
     * @param keys - Keys to delete
     * @returns Promise resolving to number of keys deleted
     */
    del: (...keys: string[]) => Promise<number>;
  };
}
