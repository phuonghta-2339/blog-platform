import { ApiProperty } from '@nestjs/swagger';

/**
 * User data included in authentication responses
 */
export class UserDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id!: number;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email!: string;

  @ApiProperty({ description: 'Unique username', example: 'johndoe' })
  username!: string;

  @ApiProperty({
    description: 'User bio',
    example: 'Software developer and writer',
    nullable: true,
    required: false,
  })
  bio!: string | null;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatars/johndoe.jpg',
    nullable: true,
    required: false,
  })
  avatar!: string | null;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
    enum: ['USER', 'ADMIN'],
  })
  role!: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-01-14T10:30:00.000Z',
    type: String,
  })
  createdAt!: Date;
}

/**
 * Response DTO for authentication operations (register, login)
 * Contains user data, JWT access token, and refresh token
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'User data', type: UserDto })
  user!: UserDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;
}
