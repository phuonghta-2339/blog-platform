import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  DEFAULT_COUNT,
  DEFAULT_FOLLOWING_STATUS,
} from '@common/constants/validation';

/**
 * Tag DTO for article response
 */
export class ArticleTagDto {
  @ApiProperty({ description: 'Tag ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Tag name', example: 'NestJS' })
  @Expose()
  name!: string;

  @ApiProperty({ description: 'Tag slug', example: 'nestjs' })
  @Expose()
  slug!: string;
}

/**
 * Author DTO for article response
 */
export class ArticleAuthorDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @Expose()
  username!: string;

  @ApiProperty({
    description: 'User bio',
    example: 'Software developer and writer',
    nullable: true,
  })
  @Expose()
  bio!: string | null;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatars/johndoe.jpg',
    nullable: true,
  })
  @Expose()
  avatar!: string | null;

  @ApiProperty({
    description: 'Whether current user follows this author',
    example: DEFAULT_FOLLOWING_STATUS,
    default: DEFAULT_FOLLOWING_STATUS,
  })
  @Expose()
  following!: boolean;
}

/**
 * Article Response DTO
 */
export class ArticleResponseDto {
  @ApiProperty({ description: 'Article ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'how-to-learn-nestjs',
  })
  @Expose()
  slug!: string;

  @ApiProperty({ description: 'Article title', example: 'How to Learn NestJS' })
  @Expose()
  title!: string;

  @ApiProperty({
    description: 'Short description',
    example: 'A comprehensive guide to learning NestJS framework',
  })
  @Expose()
  description!: string;

  @ApiProperty({
    description: 'Full article content',
    example: 'Full article content here...',
  })
  @Expose()
  body!: string;

  @ApiProperty({
    description: 'Associated tags',
    type: [ArticleTagDto],
  })
  @Expose()
  @Type(() => ArticleTagDto)
  tags!: ArticleTagDto[];

  @ApiProperty({
    description: 'Article author',
    type: ArticleAuthorDto,
  })
  @Expose()
  @Type(() => ArticleAuthorDto)
  author!: ArticleAuthorDto;

  @ApiProperty({
    description: 'Number of favorites',
    example: 45,
    type: Number,
    default: DEFAULT_COUNT,
  })
  @Expose()
  favoritesCount!: number;

  @ApiProperty({
    description: 'Number of comments',
    example: 12,
    type: Number,
    default: DEFAULT_COUNT,
  })
  @Expose()
  commentsCount!: number;

  @ApiProperty({
    description: 'Whether current user favorited this article',
    example: DEFAULT_FOLLOWING_STATUS,
    default: DEFAULT_FOLLOWING_STATUS,
  })
  @Expose()
  favorited!: boolean;

  @ApiProperty({ description: 'Published status', example: true })
  @Expose()
  isPublished!: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-14T10:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-14T10:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
