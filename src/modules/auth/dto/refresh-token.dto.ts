import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for token refresh request
 * Contains validation rules for refresh token
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token obtained from login or register endpoint',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzNzMwNDAwMCwiZXhwIjoxNjM3OTA4ODAwfQ.signature',
    minLength: 10,
  })
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsJWT({ message: 'Refresh token must be a valid JWT' })
  refreshToken!: string;
}
