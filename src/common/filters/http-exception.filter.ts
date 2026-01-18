import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
  method: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        errorResponse = {
          ...errorResponse,
          error: {
            code:
              (exceptionResponse as { error?: { code?: string } }).error
                ?.code || 'HTTP_EXCEPTION',
            message:
              (exceptionResponse as { error?: { message?: string } }).error
                ?.message ||
              (exceptionResponse as { message?: string }).message ||
              exception.message,
            details: (exceptionResponse as { error?: { details?: unknown } })
              .error?.details,
          },
        };
      } else {
        errorResponse.error.message = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      errorResponse.error.message = exception.message;
    }

    // Log error - skip logging for benign 404s (Chrome DevTools, favicon, etc.)
    const shouldSkipLogging =
      status === HttpStatus.NOT_FOUND &&
      (request.url.includes('/.well-known') ||
        request.url.includes('/favicon'));

    if (!shouldSkipLogging) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(errorResponse);
  }
}
