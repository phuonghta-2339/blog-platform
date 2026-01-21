import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Refresh Authentication Guard
 * Protects the refresh token endpoint
 *
 * Uses the jwt-refresh strategy which:
 * - Extracts refresh token from request body (OAuth2 compliant)
 * - Validates JWT signature and expiration (via Passport)
 * - Fetches fresh user data from database
 * - Attaches user to request.user
 */
@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {}
