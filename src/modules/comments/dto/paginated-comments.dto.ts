import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CommentResponseDto } from './comment-response.dto';

/**
 * Pagination metadata DTO
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items', example: 12 })
  @Expose()
  total!: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  @Expose()
  limit!: number;

  @ApiProperty({ description: 'Number of items skipped', example: 0 })
  @Expose()
  offset!: number;

  @ApiProperty({ description: 'Whether there are more items', example: false })
  @Expose()
  hasNext!: boolean;

  @ApiProperty({
    description: 'Whether there are previous items',
    example: false,
  })
  @Expose()
  hasPrev!: boolean;
}

/**
 * Paginated comments response DTO
 */
export class PaginatedCommentsDto {
  @ApiProperty({
    description: 'Array of comments',
    type: [CommentResponseDto],
  })
  @Expose()
  @Type(() => CommentResponseDto)
  comments!: CommentResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Expose()
  @Type(() => PaginationMetaDto)
  pagination!: PaginationMetaDto;
}
