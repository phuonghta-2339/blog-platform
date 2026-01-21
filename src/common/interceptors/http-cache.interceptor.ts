import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '@common/constants/cache';

/**
 * HTTP Cache Interceptor
 * Provides caching for HTTP responses with support for:
 * - Custom cache keys based on request parameters
 * - User-specific caching
 * - Configurable TTL per endpoint
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{
      url: string;
      user?: { id: number };
    }>();
    const handler = context.getHandler();

    // Get cache key prefix from metadata
    const cacheKeyPrefix =
      this.reflector.get<string>(CACHE_KEY_METADATA, handler) || 'default';

    // Get cache TTL from metadata (default: 5 minutes)
    const ttl =
      this.reflector.get<number>(CACHE_TTL_METADATA, handler) || 300000;

    // Generate cache key based on URL, query params, and user ID
    const cacheKey = this.generateCacheKey(
      cacheKeyPrefix,
      request.url,
      request.user?.id,
    );

    // Try to get from cache
    const cachedResponse = await this.cacheManager.get(cacheKey);
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // Execute handler and cache response
    return next.handle().pipe(
      tap((response) => {
        // Only cache successful responses
        if (response) {
          void this.cacheManager.set(cacheKey, response, ttl);
        }
      }),
    );
  }

  /**
   * Generate cache key from prefix, URL, and user ID
   * @param prefix - Cache key prefix
   * @param url - Request URL with query parameters
   * @param userId - Optional user ID
   * @returns Cache key
   */
  private generateCacheKey(
    prefix: string,
    url: string,
    userId?: number,
  ): string {
    const userPart = userId ? `:user:${userId}` : ':public';
    // Normalize URL path and preserve query parameters
    // Replace slashes with colons for readability
    const normalizedUrl = url.replace(/\//g, ':').replace(/\?/g, ':query:');
    return `${prefix}${normalizedUrl}${userPart}`;
  }
}

/**
 * Decorator to set cache key prefix
 * @param key - Cache key prefix
 * @returns Method decorator
 */
export const CacheKey = (key: string) =>
  Reflect.metadata(CACHE_KEY_METADATA, key);

/**
 * Decorator to set cache TTL
 * @param ttl - Time to live in milliseconds
 * @returns Method decorator
 */
export const CacheTTL = (ttl: number) =>
  Reflect.metadata(CACHE_TTL_METADATA, ttl);
