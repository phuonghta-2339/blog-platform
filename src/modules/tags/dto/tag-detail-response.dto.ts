import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TagResponseDto } from './tag-response.dto';

/**
 * Minimal article info for tag detail response
 * Will be replaced with full ArticleResponseDto when Articles module is implemented
 * @todo Replace with actual ArticleResponseDto from Articles module
 */
export class MinimalArticleDto {
  @ApiProperty({ description: 'Article ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Article slug', example: 'how-to-learn-nestjs' })
  @Expose()
  slug!: string;

  @ApiProperty({ description: 'Article title', example: 'How to Learn NestJS' })
  @Expose()
  title!: string;

  @ApiProperty({
    description: 'Article description',
    example: 'A comprehensive guide to learning NestJS framework',
  })
  @Expose()
  description!: string;

  @ApiProperty({
    description: 'Favorites count',
    example: 45,
    type: Number,
  })
  @Expose()
  favoritesCount!: number;

  @ApiProperty({
    description: 'Comments count',
    example: 12,
    type: Number,
  })
  @Expose()
  commentsCount!: number;

  @ApiProperty({
    description: 'Creation date',
    example: '2026-01-14T10:00:00.000Z',
    type: Date,
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2026-01-14T10:00:00.000Z',
    type: Date,
  })
  @Expose()
  updatedAt!: Date;
}

/**
 * DTO for tag detail response with articles
 * Extends TagResponseDto with array of recent articles
 */
export class TagDetailResponseDto extends TagResponseDto {
  @ApiProperty({
    description: 'Recent articles with this tag (limit 20)',
    type: [MinimalArticleDto],
    isArray: true,
  })
  @Expose()
  @Type(() => MinimalArticleDto)
  articles!: MinimalArticleDto[];
}
