/**
 * Metadata key for cache key prefix
 */
export const CACHE_KEY_METADATA = 'cache_key';

/**
 * Metadata key for cache TTL
 */
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Cache TTL Constants (in milliseconds)
 */
export const CACHE_TTL = {
  /** 1 minute */
  SHORT: 60000,
  /** 5 minutes */
  MEDIUM: 300000,
  /** 15 minutes */
  LONG: 900000,
  /** 1 hour */
  HOUR: 3600000,
  /** 1 day */
  DAY: 86400000,
} as const;
