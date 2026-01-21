import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Metadata key for role-based access control
 */
export const ROLES_KEY = 'roles';

/**
 * Roles decorator, restricts access to routes based on user roles
 * Works in conjunction with RolesGuard
 * @param roles - Array of allowed roles
 * @example @Roles('ADMIN', 'MODERATOR')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
