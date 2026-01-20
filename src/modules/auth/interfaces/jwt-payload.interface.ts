/**
 * JWT Payload Interface
 * Defines the structure of data stored in JWT tokens
 * Extends Record<string, any> to ensure compatibility with @nestjs/jwt
 */
export interface JwtPayload extends Record<string, unknown> {
  sub: number; // userId
  email: string;
  username: string;
  role: string;
  isActive: boolean;
}
