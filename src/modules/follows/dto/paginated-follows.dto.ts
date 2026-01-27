import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ProfileDto } from './profile.dto';

/**
 * Metadata for paginated follow lists
 */
@Exclude()
export class FollowPaginationMetaDto {
  @ApiProperty({
    description: 'Total number of follows',
    example: 150,
    type: Number,
  })
  @Expose()
  total!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    type: Number,
  })
  @Expose()
  limit!: number;

  @ApiProperty({
    description: 'Number of items skipped',
    example: 0,
    type: Number,
  })
  @Expose()
  offset!: number;

  @ApiProperty({
    description: 'Whether there are more items after current page',
    example: true,
    type: Boolean,
  })
  @Expose()
  hasNext!: boolean;
}

/**
 * Paginated response for followers/following lists
 */
@Exclude()
export class PaginatedFollowsDto {
  @ApiProperty({
    description: 'Array of profiles',
    type: [ProfileDto],
  })
  @Expose()
  @Type(() => ProfileDto)
  profiles!: ProfileDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: FollowPaginationMetaDto,
  })
  @Expose()
  @Type(() => FollowPaginationMetaDto)
  pagination!: FollowPaginationMetaDto;
}
