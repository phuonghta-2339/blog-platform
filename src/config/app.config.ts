import { registerAs } from '@nestjs/config';
import { Defaults } from '@/common/constants/defaults';

export interface AppConfig {
  env: string;
  name: string;
  port: number;
  host: string;
  apiPrefix: string;
  defaultVersion: string;
  corsOrigin: string[];
  corsMethods: string[];
  corsAllowedHeaders: string[];
  logLevel: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
}

export default registerAs('app', (): AppConfig => {
  const env = process.env.NODE_ENV || 'development';
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  // Fail fast if JWT_SECRET is missing
  if (!jwtSecret) {
    throw new Error(
      'FATAL: JWT_SECRET is required but not set in environment variables.',
    );
  }

  // Fail fast if JWT_REFRESH_SECRET is missing
  if (!jwtRefreshSecret) {
    throw new Error(
      'FATAL: JWT_REFRESH_SECRET is required but not set in environment variables.',
    );
  }

  return {
    env,
    name: process.env.APP_NAME || Defaults.APP_NAME,
    // Use defaults in development, require in production
    port: parseInt(
      process.env.PORT ||
        (env === 'production' ? '' : Defaults.DEV.APP_PORT.toString()),
      10,
    ),
    host:
      process.env.HOST || (env === 'production' ? '' : Defaults.DEV.APP_HOST),
    apiPrefix: process.env.API_PREFIX || Defaults.API_PREFIX,
    defaultVersion: process.env.API_DEFAULT_VERSION || Defaults.API_VERSION,
    corsOrigin: process.env.CORS_ORIGIN?.split(',').map((origin) =>
      origin.trim(),
    ) || [Defaults.DEV.APP_URL],
    corsMethods: process.env.CORS_METHODS?.split(',').map((method) =>
      method.trim(),
    ) || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    corsAllowedHeaders: process.env.CORS_HEADERS?.split(',').map((header) =>
      header.trim(),
    ) || ['Content-Type', 'Authorization'],
    logLevel: process.env.LOG_LEVEL || Defaults.LOG_LEVEL,
    jwtSecret: jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || Defaults.JWT_EXPIRES_IN,
    jwtRefreshSecret: jwtRefreshSecret,
    jwtRefreshExpiresIn:
      process.env.JWT_REFRESH_EXPIRES_IN || Defaults.JWT_REFRESH_EXPIRES_IN,
  };
});
