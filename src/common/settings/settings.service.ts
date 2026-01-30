import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Settings Service
 * Provides runtime configuration exclusively through environment variables
 * Implements the feature flag pattern for production control
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Parse string value to typed value
   * @param value - String value
   * @returns Parsed value
   */
  private parseValue<T>(value: string): T {
    // Try to parse as JSON for complex types
    try {
      return JSON.parse(value) as T;
    } catch {
      // Return as-is if not valid JSON
      return value as T;
    }
  }

  /**
   * Get a setting value from environment variables
   * @param key - Not used, kept for API compatibility if needed, or mapping
   * @param envKey - Environment variable key
   * @param defaultValue - Default value if not found
   * @returns Setting value
   */
  get<T = string>(key: string, envKey?: string, defaultValue?: T): T {
    const finalEnvKey = envKey || key;
    const envValue = this.configService.get<string>(finalEnvKey);

    if (envValue !== undefined && envValue !== null) {
      this.logger.debug(
        `Setting '${key}' loaded from environment (${finalEnvKey})`,
      );
      return this.parseValue<T>(envValue);
    }

    this.logger.debug(`Setting '${key}' using default value`);
    return defaultValue as T;
  }

  /**
   * Get boolean setting
   * @param key - Setting key
   * @param envKey - Environment variable key (optional)
   * @param defaultValue - Default value
   * @returns Boolean value
   */
  getBoolean(key: string, envKey?: string, defaultValue = false): boolean {
    const value = this.get<boolean | string | number>(
      key,
      envKey,
      defaultValue,
    );

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      return (
        normalized === 'true' || normalized === '1' || normalized === 'yes'
      );
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    return !!value;
  }
}
