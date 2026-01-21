import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { DatabaseModule } from '@/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

/**
 * Authentication Module
 *
 * GLOBAL GUARDS (configured in app.module.ts):
 * - ThrottlerGuard: Rate limiting
 * - JwtAuthGuard: Validates JWT on all routes (except @Public())
 * - RolesGuard: Role-based access control
 *
 */
@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('app.jwtSecret');
        const expiresIn = configService.get<string>('app.jwtExpiresIn') || '1h';

        if (!jwtSecret) {
          throw new Error(
            'JWT_SECRET configuration is missing. Cannot initialize JWT module.',
          );
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: expiresIn as StringValue,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, LocalStrategy],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
