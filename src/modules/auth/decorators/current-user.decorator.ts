import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

/**
 * Current User decorator
 * Extracts the authenticated user from the request object
 * User data is attached by JWT strategy after successful authentication
 *
 * @param data - Optional property name to extract from user object
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ):
    | AuthenticatedUser
    | AuthenticatedUser[keyof AuthenticatedUser]
    | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // If no property specified, return full user object
    if (!data) {
      return user;
    }

    // Return specific property if user exists
    return user?.[data];
  },
);
