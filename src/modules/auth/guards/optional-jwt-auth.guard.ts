import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Authentication Guard
 * Attempts to authenticate the user but does NOT throw an error if authentication fails
 * Use this for public routes that want to personalize content when a user is logged in
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override handleRequest to suppress errors
   * Returns user if authenticated, undefined if not (no exception thrown)
   */
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser | undefined {
    // If there's an error or no user, just return undefined
    if (err || !user) {
      return undefined;
    }

    return user as TUser;
  }
}
