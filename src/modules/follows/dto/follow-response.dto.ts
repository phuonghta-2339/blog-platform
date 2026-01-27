import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ProfileDto } from './profile.dto';

/**
 * Response DTO for follow/unfollow operations
 * Contains the profile after follow state change
 */
@Exclude()
export class FollowResponseDto {
  @ApiProperty({
    description: 'Profile information after follow operation',
    type: ProfileDto,
  })
  @Expose()
  @Type(() => ProfileDto)
  profile!: ProfileDto;
}
