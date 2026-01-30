/**
 * Default Values
 * Centralized SAFE default values used throughout the application
 *
 * SECURITY POLICY:
 * - Only non-sensitive, convention-based defaults are allowed here
 * - Infrastructure configs (hosts, ports, URLs, credentials) MUST come from ENV
 * - All defaults here should be safe for public repositories
 *
 * Removed sensitive defaults (now ENV-only):
 * - APP_URL, APP_HOST, APP_PORT (infrastructure)
 * - REDIS_HOST, REDIS_PORT (infrastructure)
 * - MAIL_FROM (sender identity)
 */
export const Defaults = {
  // Application Metadata (Safe)
  APP_NAME: 'Blog Platform',
  API_PREFIX: 'api',
  API_VERSION: '1',

  // JWT Token Durations (Safe - just time values)
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',

  // Logging (Safe)
  LOG_LEVEL: 'info',

  // Development-only defaults (used when NODE_ENV !== 'production')
  // These are NEVER used in production
  DEV: {
    APP_URL: 'http://localhost:3000',
    APP_HOST: 'localhost',
    APP_PORT: 3000,
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
  },
} as const;
