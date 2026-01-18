import { registerAs } from '@nestjs/config';

export interface AppConfig {
  env: string;
  name: string;
  port: number;
  host: string;
  apiPrefix: string;
  corsOrigin: string[];
  corsMethods: string[];
  corsAllowedHeaders: string[];
  logLevel: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'Blog Platform',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsOrigin: process.env.CORS_ORIGIN?.split(',').map((origin) =>
      origin.trim(),
    ) || ['http://localhost:3000'],
    corsMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    corsAllowedHeaders: ['Content-Type', 'Authorization'],
    logLevel: process.env.LOG_LEVEL || 'info',
  }),
);
