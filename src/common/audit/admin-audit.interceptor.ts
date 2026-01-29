import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestWithUser } from '@modules/auth/interfaces/request-with-user.interface';

/**
 * Admin Audit Interceptor
 * Logs all access to admin-protected routes with detailed context
 *
 * Logged Information:
 * - User ID and email
 * - Request method and URL
 * - IP address and User-Agent
 * - Response status and duration
 *
 * Use Case: Security monitoring, compliance, incident investigation
 */
@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AdminAudit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user, method, url, ip, headers } = request;

    // Extract relevant metadata
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = user?.id || 'Anonymous';
    const userEmail = user?.email || 'N/A';
    const userRole = user?.role || 'N/A';
    const timestamp = new Date().toISOString();
    const startTime = Date.now();

    // Log access attempt
    this.logger.log(
      `[ACCESS] User ${userId} (${userEmail}) [${userRole}] → ${method} ${url} | IP: ${ip} | UA: ${userAgent.substring(0, 50)}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[SUCCESS] User ${userId} → ${method} ${url} | Duration: ${duration}ms | Time: ${timestamp}`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[FAILED] User ${userId} → ${method} ${url} | Error: ${error.message} | Duration: ${duration}ms`,
          );
        },
      }),
    );
  }
}
