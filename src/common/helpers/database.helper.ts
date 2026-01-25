/**
 * Database error handling helpers
 * Centralized Prisma error handling for reusability across services
 */

import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Map of Prisma error codes to HTTP exceptions
 * Provides consistent error handling across the application
 */
const PRISMA_ERROR_MAP: Record<
  string,
  {
    exception: typeof NotFoundException | typeof BadRequestException;
    getMessage: (error: Prisma.PrismaClientKnownRequestError) => string;
  }
> = {
  P2025: {
    exception: NotFoundException,
    getMessage: () => 'Resource not found',
  },
  P2002: {
    exception: BadRequestException,
    getMessage: (error) =>
      `Duplicate entry: ${(error.meta?.target as string[])?.[0] ?? 'unknown field'}`,
  },
  P2003: {
    exception: BadRequestException,
    getMessage: () => 'Referenced record not found',
  },
  P2000: {
    exception: BadRequestException,
    getMessage: () => 'Value too long for column',
  },
  P2001: {
    exception: NotFoundException,
    getMessage: () => 'Record not found',
  },
};

/**
 * Handle Prisma errors and throw appropriate HTTP exceptions
 * Centralizes error handling logic for reuse across services
 * Automatically rethrows existing HTTP exceptions without modification
 *
 * @param error - Error from Prisma operation or HTTP exception
 * @param context - Context string for logging (e.g., service method name)
 * @param logger - Logger instance for error logging
 * @throws HTTP exception based on Prisma error type or rethrows existing HTTP exception
 */
export function handlePrismaError(
  error: Error,
  context: string,
  logger: Logger,
): never {
  // Rethrow HTTP exceptions without modification (business logic exceptions)
  if (error instanceof HttpException) {
    throw error;
  }

  logger.error(
    `[${context}] Prisma error: ${error instanceof Error ? error.message : String(error)}`,
  );

  // Handle known Prisma errors with specific error codes
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorHandler = PRISMA_ERROR_MAP[error.code];
    if (errorHandler) {
      throw new errorHandler.exception(errorHandler.getMessage(error));
    }
  }

  // Handle validation errors (invalid query/data structure)
  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new BadRequestException('Invalid request data');
  }

  // For any other Prisma error or unexpected errors, throw 500
  throw new InternalServerErrorException(
    `${context}: An unexpected error occurred`,
  );
}
