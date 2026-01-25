/**
 * Validation constants used across application
 * Contains only essential shared constants
 */

export const EMAIL_MAX_LENGTH = 255;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const BIO_MAX_LENGTH = 500;
export const AVATAR_URL_MAX_LENGTH = 1000;
export const JWT_MIN_LENGTH = 10;

/**
 * Pagination limits
 */
export const PAGINATION_LIMIT_MIN = 1;
export const PAGINATION_LIMIT_MAX = 99;
export const PAGINATION_LIMIT_DEFAULT = 20;
export const PAGINATION_OFFSET_MIN = 0;
export const PAGINATION_OFFSET_DEFAULT = 0;

/**
 * Default count values for statistics
 */
export const DEFAULT_COUNT = 0;
export const DEFAULT_FOLLOWING_STATUS = false;

/**
 * Example JWT token for API documentation
 */
export const EXAMPLE_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

/**
 * Article field constraints
 */
export const ARTICLE_TITLE_MIN_LENGTH = 1;
export const ARTICLE_TITLE_MAX_LENGTH = 255;
export const ARTICLE_DESCRIPTION_MIN_LENGTH = 1;
export const ARTICLE_DESCRIPTION_MAX_LENGTH = 1000;
export const ARTICLE_BODY_MIN_LENGTH = 1;
export const ARTICLE_TAG_LIST_MAX_SIZE = 10;

/**
 * Updatable fields for article update validation
 * Centralized to ensure consistency and ease of maintenance
 */
export const ARTICLE_UPDATABLE_FIELDS = [
  'title',
  'description',
  'body',
  'tagList',
  'isPublished',
] as const;
