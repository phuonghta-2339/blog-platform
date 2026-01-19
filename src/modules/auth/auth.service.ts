import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';
import { PrismaService } from '../../database/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

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

    // Check if email already exists
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new BadRequestException('Email already registered');
    }

    // Check if username already exists
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      throw new BadRequestException('Username already taken');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Authenticate user with email and password
   * @param loginDto - User login credentials
   * @returns User data and JWT token
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Generate a new JWT token for authenticated user
   * @param userId - ID of the authenticated user
   * @returns New JWT access token
   * @throws UnauthorizedException if user not found or inactive
   */
  async refresh(userId: number): Promise<{ token: string }> {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // Generate new token
    const token = this.generateToken(user);

    return { token };
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
   * Generate JWT token from user data
   * @param user - User object
   * @returns Signed JWT token
   * @private
   */
  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
