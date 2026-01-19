import { registerAs } from '@nestjs/config';

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
}

export default registerAs('app', (): AppConfig => {
  const env = process.env.NODE_ENV || 'development';
  const jwtSecret = process.env.JWT_SECRET;

  // Fail fast if JWT_SECRET is missing
  if (!jwtSecret) {
    throw new Error(
      'FATAL: JWT_SECRET is required but not set in environment variables.',
    );
  }

  return {
    env,
    name: process.env.APP_NAME || 'Blog Platform',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || 'api',
    defaultVersion: process.env.API_DEFAULT_VERSION || '1',
    corsOrigin: process.env.CORS_ORIGIN?.split(',').map((origin) =>
      origin.trim(),
    ) || ['http://localhost:3000'],
    corsMethods: process.env.CORS_METHODS?.split(',').map((method) =>
      method.trim(),
    ) || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    corsAllowedHeaders: process.env.CORS_HEADERS?.split(',').map((header) =>
      header.trim(),
    ) || ['Content-Type', 'Authorization'],
    logLevel: process.env.LOG_LEVEL || 'info',
    jwtSecret: jwtSecret || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
});
