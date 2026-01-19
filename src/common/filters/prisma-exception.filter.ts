import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

type PrismaError =
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientValidationError
  | Prisma.PrismaClientInitializationError
  | Prisma.PrismaClientUnknownRequestError
  | Prisma.PrismaClientRustPanicError;

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientRustPanicError,
)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'DATABASE_ERROR';
    let message = 'A database error occurred';

    // Handle PrismaClientKnownRequestError
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ status, code, message } = this.handleKnownRequestError(exception));
    }
    // Handle PrismaClientValidationError
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Invalid data provided to database operation';
      this.logger.error(`Prisma Validation Error: ${exception.message}`);
    }
    // Handle PrismaClientInitializationError
    else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      code = 'DATABASE_INITIALIZATION_ERROR';
      message = 'Database connection could not be established';
      this.logger.error(
        `Prisma Initialization Error: ${exception.message}`,
        exception.stack,
      );
    }
    // Handle PrismaClientUnknownRequestError
    else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'UNKNOWN_DATABASE_ERROR';
      message = 'An unknown database error occurred';
      this.logger.error(
        `Prisma Unknown Request Error: ${exception.message}`,
        exception.stack,
      );
    }
    // Handle PrismaClientRustPanicError
    else if (exception instanceof Prisma.PrismaClientRustPanicError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'DATABASE_PANIC_ERROR';
      message = 'A critical database error occurred';
      this.logger.error(
        `Prisma Rust Panic Error: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private handleKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): { status: number; code: string; message: string } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'DATABASE_ERROR';
    let message = 'A database error occurred';

    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        code = 'UNIQUE_CONSTRAINT_VIOLATION';
        message = `Duplicate value for field: ${(exception.meta?.target as string[])?.join(', ') ?? 'unknown'}`;
        break;
      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        code = 'RECORD_NOT_FOUND';
        message = 'Record not found';
        break;
      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        code = 'FOREIGN_KEY_VIOLATION';
        message = 'Related record not found';
        break;
      case 'P2000':
        // Value too long for column
        status = HttpStatus.BAD_REQUEST;
        code = 'VALUE_TOO_LONG';
        message = 'The provided value is too long for the database column';
        break;
      case 'P2001':
        // Record does not exist
        status = HttpStatus.NOT_FOUND;
        code = 'RECORD_NOT_FOUND';
        message = 'The record searched for does not exist';
        break;
    }

    this.logger.error(
      `Prisma Known Request Error: ${exception.code} - ${exception.message}`,
      exception.stack,
    );

    return { status, code, message };
  }
}
