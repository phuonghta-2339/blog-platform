import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  PAGINATION_LIMIT_DEFAULT,
  PAGINATION_LIMIT_MAX,
  PAGINATION_LIMIT_MIN,
  PAGINATION_OFFSET_DEFAULT,
  PAGINATION_OFFSET_MIN,
} from '@common/constants/validation';

/**
 * Pagination Query DTO
 * Used for endpoints that support pagination
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: PAGINATION_LIMIT_MIN,
    maximum: PAGINATION_LIMIT_MAX,
    default: PAGINATION_LIMIT_DEFAULT,
    example: PAGINATION_LIMIT_DEFAULT,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION_LIMIT_MIN)
  @Max(PAGINATION_LIMIT_MAX)
  limit: number = PAGINATION_LIMIT_DEFAULT;

  @ApiPropertyOptional({
    description: 'Number of items to skip (for pagination)',
    minimum: PAGINATION_OFFSET_MIN,
    default: PAGINATION_OFFSET_DEFAULT,
    example: PAGINATION_OFFSET_DEFAULT,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION_OFFSET_MIN)
  offset: number = PAGINATION_OFFSET_DEFAULT;
}
