import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public routes
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public route decorator
 * Marks a route as public, bypassing JWT authentication
 * Use this decorator on routes that don't require authentication
 * @example @Public()
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
