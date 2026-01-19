import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * Local Authentication Strategy
 * Validates user credentials (email/password) for login
 * Used by LocalAuthGuard for username/password authentication
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Use email instead of username for login
      passwordField: 'password',
    });
  }

  async validate(
    email: string,
    password: string,
  ): Promise<{
    id: number;
    email: string;
    username: string;
    role: string;
  }> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }
}
