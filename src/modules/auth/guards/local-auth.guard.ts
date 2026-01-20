import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Local Authentication Guard
 * Protects endpoints that require username/password authentication
 * Provides detailed error messages for authentication failures
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  /**
   * Override handleRequest to provide more specific error messages
   * @param err - Error from strategy validation
   * @param user - User object from strategy or false
   * @param info - Additional info from strategy
   * @throws UnauthorizedException with appropriate message
   */
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    info: Error | null,
  ): TUser {
    // Handle errors from strategy validation
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(info?.message || 'Invalid email or password')
      );
    }

    return user;
  }
}
