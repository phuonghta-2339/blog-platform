/**
 * Database-related constants
 */

/**
 * Maximum number of retries for database queries
 */
export const MAX_QUERY_RETRIES = 3;

/**
 * Prisma Error Codes
 * Centralized error codes to avoid magic strings and ensure consistency
 */
export const PRISMA_ERRORS = {
  UNIQUE_CONSTRAINT: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
  FOREIGN_KEY_CONSTRAINT: 'P2003',
} as const;
