import { Role } from '@prisma/client';

/**
 * User data required for JWT token generation
 * Contains only essential fields needed in JWT payload
 */
export interface UserForToken {
  id: number;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
}
