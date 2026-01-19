import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from './app.config';
import type { DatabaseConfig } from './database.config';

/**
 * Type-safe configuration service wrapper
 * Provides easy access to configuration values with proper typing
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get application configuration
   */
  get app(): AppConfig {
    const config = this.configService.get<AppConfig>('app');
    if (!config) {
      throw new Error('App configuration not found');
    }
    return config;
  }

  /**
   * Get database configuration
   */
  get database(): DatabaseConfig {
    const config = this.configService.get<DatabaseConfig>('database');
    if (!config) {
      throw new Error('Database configuration not found');
    }
    return config;
  }

  /**
   * Check if running in production
   */
  get isProduction(): boolean {
    return this.app.env === 'production';
  }

  /**
   * Check if running in development
   */
  get isDevelopment(): boolean {
    return this.app.env === 'development';
  }

  /**
   * Check if running in test
   */
  get isTest(): boolean {
    return this.app.env === 'test';
  }

  /**
   * Get full API base URL
   */
  getApiUrl(): string {
    const { host, port, apiPrefix } = this.app;
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    return `http://${displayHost}:${port}/${apiPrefix}`;
  }

  /**
   * Get Swagger documentation URL
   */
  getSwaggerUrl(): string {
    const { host, port } = this.app;
    const displayHost = host === '0.0.0.0' ? 'localhost' : host;
    return `http://${displayHost}:${port}/api/docs`;
  }
}
