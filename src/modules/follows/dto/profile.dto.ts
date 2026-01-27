import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  DEFAULT_COUNT,
  DEFAULT_FOLLOWING_STATUS,
} from '@common/constants/validation';

/**
 * DTO for profile information returned in follow operations
 * Compact profile data focused on follow-related info
 */
@Exclude()
export class ProfileDto {
  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
    type: String,
  })
  @Expose()
  username!: string;

  @ApiProperty({
    description: 'User bio',
    example: 'Software developer and technical writer',
    nullable: true,
    type: String,
  })
  @Expose()
  bio!: string | null;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatars/johndoe.jpg',
    nullable: true,
    type: String,
  })
  @Expose()
  avatar!: string | null;

  @ApiProperty({
    description: 'Whether the current user is following this profile',
    example: true,
    type: Boolean,
    default: DEFAULT_FOLLOWING_STATUS,
  })
  @Expose()
  following!: boolean;

  @ApiProperty({
    description: 'Number of followers',
    example: 201,
    type: Number,
    default: DEFAULT_COUNT,
  })
  @Expose()
  followersCount!: number;
}
