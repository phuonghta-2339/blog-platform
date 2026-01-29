/**
 * Redis configuration
 * Uses defaults in development, requires explicit config in production
 */

import { registerAs } from '@nestjs/config';
import { Defaults } from '@/common/constants/defaults';

export const redisConfig = registerAs('redis', () => {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';

  return {
    host:
      process.env.REDIS_HOST || (isProduction ? '' : Defaults.DEV.REDIS_HOST),
    port: parseInt(
      process.env.REDIS_PORT ||
        (isProduction ? '' : Defaults.DEV.REDIS_PORT.toString()),
      10,
    ),
    password: process.env.REDIS_PASSWORD || undefined,
  };
});
