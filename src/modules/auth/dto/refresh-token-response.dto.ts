import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for token refresh operation
 * Contains the new JWT access token
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token!: string;
}
