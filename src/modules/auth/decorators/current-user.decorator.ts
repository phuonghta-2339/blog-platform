import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

/**
 * Current User decorator
 * Extracts the authenticated user from the request object
 * User data is attached by JWT strategy after successful authentication
 * @example async getProfile(@CurrentUser() user: AuthenticatedUser)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
