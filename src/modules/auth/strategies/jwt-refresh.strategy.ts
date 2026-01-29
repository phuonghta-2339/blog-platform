import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { ConfigKeys } from '@/common/constants/config-keys';
import { PrismaService } from '@/database/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Custom JWT extractor that reads refresh token from request body
 * This allows OAuth2-compliant body-based refresh token flow
 * while still leveraging Passport's built-in JWT verification
 */
const extractJwtFromBody = (req: Request): string | null => {
  const body = req.body as { refreshToken?: unknown };
  if (body && typeof body.refreshToken === 'string') {
    return body.refreshToken;
  }
  return null;
};

/**
 * JWT Refresh Token Strategy
 * Validates refresh tokens from request body and attaches user data to the request
 *
 * ARCHITECTURE DECISION:
 * - Uses Passport Strategy for automatic JWT verification (avoid manual validation)
 * - Custom extractor reads token from body (OAuth2 RFC 6749 compliant)
 * - Single database query to fetch fresh user data
 * - Combines benefits of both Strategy Pattern and Direct Validation
 *
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const jwtRefreshSecret = configService.get<string>(
      ConfigKeys.APP.JWT_REFRESH_SECRET,
    );

    if (!jwtRefreshSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET configuration is missing. Cannot initialize JWT refresh authentication.',
      );
    }

    super({
      // Custom extractor: reads token from request body
      jwtFromRequest: extractJwtFromBody,
      ignoreExpiration: false,
      secretOrKey: jwtRefreshSecret,
      // Pass request to validate method for additional context if needed
      passReqToCallback: false,
    });
  }

  /**
   * Validate JWT refresh token and verify user still exists and is active
   * Passport automatically verifies JWT signature and expiration before calling this
   *
   * @param payload - Decoded JWT refresh token payload (verified by Passport)
   * @returns User object attached to request.user
   * @throws UnauthorizedException if user not found or inactive
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // JWT already verified by Passport (signature + expiration)
    // Now fetch fresh user data and validate status

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Please login again.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Contact support.',
      );
    }

    // Return user object that will be attached to request.user
    // This will be passed to the controller
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
