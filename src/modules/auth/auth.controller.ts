import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import {
  ApiLogin,
  ApiRefreshToken,
  ApiRegister,
} from './decorators/api-auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

/**
 * Auth Controller
 * Handles authentication endpoints: register, login, and token refresh
 */
@ApiTags('auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiRegister()
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiLogin()
  login(
    @Body() _loginDto: LoginDto, // Validated by DTOs, used by LocalAuthGuard
    @Request() req: { user: User },
  ): AuthResponseDto {
    // User is already validated by LocalAuthGuard and LocalStrategy
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiRefreshToken()
  refresh(
    @Body() _refreshTokenDto: RefreshTokenDto, // Validated by DTO, extracted by strategy
    @CurrentUser() user: AuthenticatedUser, // Populated by JwtRefreshStrategy
  ): RefreshTokenResponseDto {
    // User already validated by JwtRefreshStrategy:
    return this.authService.refresh(user);
  }
}
