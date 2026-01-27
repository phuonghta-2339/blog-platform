import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SortOrder, DEFAULT_SORT_ORDER } from '@common/constants/validation';

/**
 * Query DTO for followers/following lists with pagination
 * Extends base pagination with sorting options
 */
export class FollowListQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Sort order by follow creation time',
    enum: SortOrder,
    default: DEFAULT_SORT_ORDER,
    example: DEFAULT_SORT_ORDER,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = DEFAULT_SORT_ORDER;
}
