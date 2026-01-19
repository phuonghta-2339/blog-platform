import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Validate PostgreSQL connection URL format
 * @param url - Database connection string
 * @returns boolean indicating if URL is valid
 */
function isValidPostgreSQLUrl(url: string): boolean {
  try {
    // Check if URL starts with postgresql:// or postgres://
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      return false;
    }

    // Parse URL to validate structure
    const parsedUrl = new URL(url);

    // Validate protocol
    if (
      parsedUrl.protocol !== 'postgresql:' &&
      parsedUrl.protocol !== 'postgres:'
    ) {
      return false;
    }

    // Validate hostname exists
    if (!parsedUrl.hostname) {
      return false;
    }

    // Validate pathname (database name) exists and is not just '/'
    if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
      return false;
    }

    return true;
  } catch {
    // URL parsing failed
    return false;
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Validate DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const connectionString: string = process.env.DATABASE_URL;

    // Validate DATABASE_URL format
    if (!isValidPostgreSQLUrl(connectionString)) {
      throw new Error(
        'DATABASE_URL is invalid. Expected format: postgresql://user:password@host:port/database',
      );
    }

    // Create PostgreSQL connection pool with error handling
    let pool: Pool;
    try {
      pool = new Pool({ connectionString });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create database connection pool: ${message}`);
    }

    // Create Prisma adapter
    const adapter: PrismaPg = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      // Type assertion for event-emitting PrismaClient
      type QueryEvent = { query: string; duration: number };
      const prismaWithEvents = this as PrismaClient & {
        $on: (event: 'query', callback: (e: QueryEvent) => void) => void;
      };

      prismaWithEvents.$on('query', (e: QueryEvent) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Clean database for testing
   * Deletes all records from all tables in the correct order to respect foreign key constraints
   * IMPORTANT: Only works in non-production environments
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Define models in deletion order (respecting foreign key constraints)
    // Child tables first, parent tables last
    const modelsInOrder = [
      'articleTag',
      'favorite',
      'comment',
      'follow',
      'article',
      'tag',
      'user',
    ] as const;

    // Delete in order to avoid foreign key constraint violations
    for (const modelName of modelsInOrder) {
      const model = this[modelName as keyof PrismaService];

      if (model && typeof model === 'object' && 'deleteMany' in model) {
        await (model as { deleteMany: () => Promise<unknown> }).deleteMany();
        this.logger.debug(`Cleaned ${modelName} table`);
      }
    }

    this.logger.log('Database cleaned successfully');
  }

  /**
   * Clean specific tables for testing
   * @param tableNames - Array of table names to clean
   */
  async cleanTables(tableNames: string[]): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    for (const tableName of tableNames) {
      const model = this[tableName as keyof PrismaService];

      if (model && typeof model === 'object' && 'deleteMany' in model) {
        await (model as { deleteMany: () => Promise<unknown> }).deleteMany();
        this.logger.debug(`Cleaned ${tableName} table`);
      } else {
        this.logger.warn(
          `Model ${tableName} not found or doesn't support deleteMany`,
        );
      }
    }
  }
}
