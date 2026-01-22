import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';
import { DEFAULT_COUNT } from '@common/constants/validation';

/**
 * DTO for user response
 * Transforms user entity to client-safe format
 * Excludes sensitive fields like password
 */
@Exclude()
export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
    type: Number,
  })
  @Expose()
  id!: number;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    type: String,
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
    type: String,
  })
  @Expose()
  username!: string;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'Software developer and technical writer',
    nullable: true,
    type: String,
  })
  @Expose()
  bio!: string | null;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatars/johndoe.jpg',
    nullable: true,
    type: String,
  })
  @Expose()
  avatar!: string | null;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  @Expose()
  role!: Role;

  @ApiProperty({
    description: 'Number of followers',
    example: 150,
    type: Number,
    default: DEFAULT_COUNT,
  })
  @Expose()
  followersCount!: number;

  @ApiProperty({
    description: 'Number of users following',
    example: 75,
    type: Number,
    default: DEFAULT_COUNT,
  })
  @Expose()
  followingCount!: number;

  @ApiProperty({
    description: 'Number of articles written',
    example: 25,
    type: Number,
    default: DEFAULT_COUNT,
  })
  @Expose()
  articlesCount!: number;

  @ApiProperty({
    description: 'Account creation date',
    example: '2026-01-14T10:30:00.000Z',
    type: Date,
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2026-01-14T11:00:00.000Z',
    type: Date,
  })
  @Expose()
  updatedAt!: Date;
}
