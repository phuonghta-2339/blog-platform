import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser {
  user?: unknown;
}

/**
 * Current User decorator
 * Extracts the authenticated user from the request object
 * User data is attached by JWT strategy after successful authentication
 * @example async getProfile(@CurrentUser() user: JwtPayload)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
