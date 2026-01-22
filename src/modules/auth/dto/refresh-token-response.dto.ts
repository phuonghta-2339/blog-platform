import { ApiProperty } from '@nestjs/swagger';
import { EXAMPLE_JWT_TOKEN } from '@common/constants/validation';

/**
 * Response DTO for token refresh operation
 * Contains new JWT access token and refresh token
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: EXAMPLE_JWT_TOKEN,
  })
  token!: string;

  @ApiProperty({
    description: 'New JWT refresh token',
    example: EXAMPLE_JWT_TOKEN,
  })
  refreshToken!: string;
}
