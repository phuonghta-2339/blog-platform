import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * JWT Authentication Strategy
 * Validates JWT tokens and attaches user data to the request
 * Checks if user exists and is active before granting access
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('app.jwtSecret') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<{
    id: number;
    email: string;
    username: string;
    role: string;
  }> {
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

    // Return user object that will be attached to request.user
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }
}
