import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * DTO for public profile response
 * Only includes information safe for public viewing
 */
@Exclude()
export class PublicProfileDto {
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
    description: 'Number of followers',
    example: 150,
    type: Number,
    default: 0,
  })
  @Expose()
  followersCount!: number;

  @ApiProperty({
    description: 'Number of articles written',
    example: 25,
    type: Number,
    default: 0,
  })
  @Expose()
  articlesCount!: number;

  @ApiProperty({
    description:
      'Whether the current user is following this profile (false if not authenticated)',
    example: false,
    type: Boolean,
    default: false,
  })
  @Expose()
  following!: boolean;
}
