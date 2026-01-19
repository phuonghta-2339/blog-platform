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
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

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
  login(@Request() req: { user: User }): AuthResponseDto {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiRefreshToken()
  async refresh(
    @CurrentUser() user: { id: number },
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refresh(user.id);
  }
}
