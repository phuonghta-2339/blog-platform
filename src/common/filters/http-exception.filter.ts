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

/**
 * Sanitize URL path to prevent sensitive data leakage
 * - Removes query parameters (may contain tokens, passwords, etc.)
 * - Masks numeric IDs and UUIDs in path segments
 * - Masks common sensitive patterns
 */
function sanitizePath(url: string): string {
  try {
    // Remove query parameters and hash fragments
    const pathOnly = url.split('?')[0].split('#')[0];

    // Mask numeric IDs (e.g., /users/123 -> /users/:id)
    let sanitized = pathOnly.replace(/\/\d+/g, '/:id');

    // Mask UUIDs (e.g., /users/550e8400-e29b-41d4-a716-446655440000 -> /users/:uuid)
    sanitized = sanitized.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:uuid',
    );

    // Mask common sensitive patterns
    const sensitivePatterns = [
      /\/token\/[^/]+/gi,
      /\/reset-password\/[^/]+/gi,
      /\/verify\/[^/]+/gi,
      /\/activation\/[^/]+/gi,
      /\/secret\/[^/]+/gi,
    ];

    sensitivePatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, (match) => {
        const parts = match.split('/');
        return `/${parts[1]}/:masked`;
      });
    });

    return sanitized;
  } catch {
    // Fallback to a generic path if parsing fails
    return '/[sanitized]';
  }
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
      path: sanitizePath(request.url),
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
