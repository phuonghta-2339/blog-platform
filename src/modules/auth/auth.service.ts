import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';
import { PrismaService } from '../../database/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserForToken } from './interfaces/user-for-token.interface';

/**
 * Authentication Service
 * Handles user registration, login, token generation and validation
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user account
   * @param registerDto - User registration data
   * @returns User data and JWT token
   * @throws BadRequestException if email or username already exists
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password } = registerDto;

    let user: User;

    try {
      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      user = await this.prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          role: 'USER',
          isActive: true,
        },
      });
    } catch (error) {
      // Handle unique constraint violations
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Get the field that caused the unique constraint violation
        const target = error.meta?.target as string[] | undefined;

        if (target?.includes('email')) {
          throw new BadRequestException('Email already registered');
        }

        if (target?.includes('username')) {
          throw new BadRequestException('Username already taken');
        }

        // Fallback for unknown unique constraint
        throw new BadRequestException('Registration failed: duplicate entry');
      }

      // Re-throw other errors
      throw error;
    }

    // Generate JWT tokens AFTER user creation succeeds
    // If token generation fails, user exists but can login again
    // This is acceptable as token generation rarely fails and user data is preserved
    try {
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return {
        user: this.mapUserToDto(user),
        token,
        refreshToken,
      };
    } catch (tokenError) {
      // Log token generation failure for monitoring
      console.error(
        'Token generation failed after user creation:',
        tokenError instanceof Error ? tokenError.message : String(tokenError),
      );

      throw new BadRequestException(
        'Account created successfully but token generation failed. Please try logging in.',
      );
    }
  }

  /**
   * Generate authentication response for validated user
   * User is already validated by LocalStrategy before reaching this method
   * @param user - Validated user object from LocalStrategy
   * @returns User data and JWT token
   */
  login(user: User): AuthResponseDto {
    // Generate JWT tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.mapUserToDto(user),
      token,
      refreshToken,
    };
  }

  /**
   * Generate new JWT tokens using a valid refresh token
   * Validates the refresh token and generates new access and refresh tokens
   * @param refreshToken - The refresh token from request body
   * @returns New JWT access token and refresh token
   * @throws UnauthorizedException if refresh token is invalid, expired, or user is inactive
   */
  async refresh(
    refreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> {
    // Verify and decode refresh token
    let payload: JwtPayload;
    const refreshSecret = this.configService.get<string>(
      'app.jwtRefreshSecret',
    );

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get latest user data to ensure user still exists and is active
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

    // Generate new tokens
    const newToken = this.generateToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    return { token: newToken, refreshToken: newRefreshToken };
  }

  /**
   * Validate user credentials
   * @param email - User email address
   * @param password - User password
   * @returns User object if valid, null otherwise
   * @throws UnauthorizedException if account is deactivated
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Map User entity to response DTO format
   * Extracts only the fields needed for API responses
   * @param user - User entity from database
   * @returns User data for API response
   * @private
   */
  private mapUserToDto(user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Generate JWT access token from user data
   * Includes user status in payload for stateless validation
   * @param user - User object with essential fields for token
   * @returns Signed JWT access token
   * @private
   */
  private generateToken(user: UserForToken): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generate JWT refresh token from user data
   * Includes user status in payload for stateless validation
   * @param user - User object with essential fields for token
   * @returns Signed JWT refresh token with longer expiration
   * @private
   */
  private generateRefreshToken(user: UserForToken): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };

    const refreshSecret = this.configService.get<string>(
      'app.jwtRefreshSecret',
    );

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    const refreshExpiresIn =
      this.configService.get<string>('app.jwtRefreshExpiresIn') || '7d';

    return this.jwtService.sign(payload as Record<string, unknown>, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as string & number,
    });
  }
}
