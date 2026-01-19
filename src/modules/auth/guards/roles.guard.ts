import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestWithUser {
  user?: {
    role: Role;
  };
}

/**
 * Roles Guard
 * Implements role-based access control
 * Checks if the authenticated user has the required role(s) for the route
 * Routes without @Roles() decorator are accessible by all authenticated users
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user } = request;

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required for role-based access',
      );
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
