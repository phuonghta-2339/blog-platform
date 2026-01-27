import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  PAGINATION_LIMIT_MIN,
  PAGINATION_LIMIT_MAX,
  PAGINATION_LIMIT_DEFAULT,
  PAGINATION_OFFSET_MIN,
  PAGINATION_OFFSET_DEFAULT,
  SortOrder,
  DEFAULT_SORT_ORDER,
} from '@common/constants/validation';
import {
  transformNumberWithDefault,
  transformEnumWithDefault,
} from '@common/helpers/transform.helper';

/**
 * Sort field enum for articles
 */
export enum ArticleSortBy {
  CREATED_AT = 'createdAt',
  FAVORITES_COUNT = 'favoritesCount',
  COMMENTS_COUNT = 'commentsCount',
}

/**
 * DTO for querying articles with filters and pagination
 */
export class ArticleQueryDto {
  @ApiProperty({
    description: 'Filter by tag slug',
    example: 'javascript',
    required: false,
  })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({
    description: 'Filter by author username',
    example: 'johndoe',
    required: false,
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({
    description: 'Filter by user who favorited (username)',
    example: 'janedoe',
    required: false,
  })
  @IsString()
  @IsOptional()
  favorited?: string;

  @ApiProperty({
    description: 'Number of items per page',
    example: PAGINATION_LIMIT_DEFAULT,
    default: PAGINATION_LIMIT_DEFAULT,
    minimum: PAGINATION_LIMIT_MIN,
    maximum: PAGINATION_LIMIT_MAX,
    required: false,
  })
  @Transform(transformNumberWithDefault(PAGINATION_LIMIT_DEFAULT))
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION_LIMIT_MIN)
  @Max(PAGINATION_LIMIT_MAX)
  @IsOptional()
  limit?: number = PAGINATION_LIMIT_DEFAULT;

  @ApiProperty({
    description: 'Number of items to skip',
    example: PAGINATION_OFFSET_DEFAULT,
    default: PAGINATION_OFFSET_DEFAULT,
    minimum: PAGINATION_OFFSET_MIN,
    required: false,
  })
  @Transform(transformNumberWithDefault(PAGINATION_OFFSET_DEFAULT))
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION_OFFSET_MIN)
  @IsOptional()
  offset?: number = PAGINATION_OFFSET_DEFAULT;

  @ApiProperty({
    description: 'Sort field',
    example: 'createdAt',
    enum: ArticleSortBy,
    default: ArticleSortBy.CREATED_AT,
    required: false,
  })
  @Transform(transformEnumWithDefault(ArticleSortBy.CREATED_AT))
  @IsEnum(ArticleSortBy)
  @IsOptional()
  sortBy?: ArticleSortBy = ArticleSortBy.CREATED_AT;

  @ApiProperty({
    description: 'Sort order',
    example: DEFAULT_SORT_ORDER,
    enum: SortOrder,
    default: DEFAULT_SORT_ORDER,
    required: false,
  })
  @Transform(transformEnumWithDefault(DEFAULT_SORT_ORDER))
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder = DEFAULT_SORT_ORDER;
}
