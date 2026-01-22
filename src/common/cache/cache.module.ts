import { Global, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

/**
 * Cache Module
 * Provides in-memory caching capabilities across the application using @nestjs/cache-manager
 * Global module - no need to import in other modules
 *
 * Configuration:
 * - In-memory store
 * - TTL: 5 minutes (300000 milliseconds)
 * - Max items: 100
 */
@Global()
@Module({
  imports: [
    NestCacheModule.register({
      ttl: 300000, // 5 minutes in milliseconds (cache-manager uses milliseconds in v5+)
      max: 100, // Maximum number of items in cache
      isGlobal: true,
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
