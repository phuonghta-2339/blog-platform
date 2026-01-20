/**
 * Authenticated User Interface
 * Represents the user object attached to requests after JWT authentication
 * This is the payload returned by JWT strategies and attached to request.user
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  username: string;
  role: string;
}
