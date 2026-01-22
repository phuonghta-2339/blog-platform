import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';
import {
  EXAMPLE_JWT_TOKEN,
  JWT_MIN_LENGTH,
} from '@common/constants/validation';

/**
 * Data Transfer Object for token refresh request
 * Contains validation rules for refresh token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token obtained from login or register endpoint',
    example: EXAMPLE_JWT_TOKEN,
    minLength: JWT_MIN_LENGTH,
  })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsJWT({ message: 'Refresh token must be a valid JWT' })
  refreshToken!: string;
}
