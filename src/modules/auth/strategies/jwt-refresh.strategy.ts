import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT Refresh Token Strategy
 * Validates refresh tokens and attaches user data to the request
 * Used specifically for the token refresh endpoint
 * Allows slightly more lenient validation for token renewal
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
    const jwtRefreshSecret = configService.get<string>('app.jwtRefreshSecret');

    if (!jwtRefreshSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET configuration is missing. Cannot initialize JWT refresh authentication.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtRefreshSecret,
    });
  }

  /**
   * Validate JWT refresh token and verify user still exists and is active
   * Unlike JwtStrategy, this performs a database query to get fresh user data
   * This ensures refresh tokens are validated against current user state
   *
   * @param payload - Decoded JWT refresh token payload
   * @returns User object attached to request.user
   * @throws UnauthorizedException if user not found or inactive
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
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
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }
}
