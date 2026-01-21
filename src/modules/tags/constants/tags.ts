/**
 * Tags Module Constants
 * Module-specific constants for Tags feature
 */

/**
 * Maximum number of articles to include in tag detail response
 * Prevents excessive data loading for tags with many articles
 */
export const TAG_DETAIL_ARTICLES_LIMIT = 20;

/**
 * Default ordering for tags list
 * Alphabetically by name for better UX
 */
export const TAG_DEFAULT_ORDER = 'name';
