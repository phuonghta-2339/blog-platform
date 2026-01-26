import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ArticleResponseDto } from './article-response.dto';

/**
 * Pagination metadata DTO
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items', example: 150 })
  @Expose()
  total!: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  @Expose()
  limit!: number;

  @ApiProperty({ description: 'Number of items skipped', example: 0 })
  @Expose()
  offset!: number;

  @ApiProperty({ description: 'Whether there are more items', example: true })
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
 * Paginated articles response DTO
 */
export class PaginatedArticlesDto {
  @ApiProperty({
    description: 'Array of articles',
    type: [ArticleResponseDto],
  })
  @Expose()
  @Type(() => ArticleResponseDto)
  articles!: ArticleResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Expose()
  @Type(() => PaginationMetaDto)
  pagination!: PaginationMetaDto;
}
