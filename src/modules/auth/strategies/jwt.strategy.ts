import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT Authentication Strategy
 * Validates JWT tokens and attaches user data to the request
 *
 * PERFORMANCE OPTIMIZATION:
 * This strategy validates users from the JWT payload WITHOUT database queries.
 * The isActive status is included in the JWT payload to avoid DB lookups on every request.
 * Used by JwtAuthGuard for protecting routes with JWT authentication
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('app.jwtSecret');

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET configuration is missing. Cannot initialize JWT authentication.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validate JWT payload and extract user information
   * This method is called on every authenticated request
   *
   * @param payload - Decoded JWT payload containing user information
   * @returns User object attached to request.user
   * @throws UnauthorizedException if account is deactivated
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    // Validate account status from payload (no DB query)
    if (!payload.isActive) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact support.',
      );
    }

    // Return user object that will be attached to request.user
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  }
}
