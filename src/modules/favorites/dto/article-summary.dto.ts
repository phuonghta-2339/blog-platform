import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Article Summary DTO
 * Minimal article info returned after favorite/unfavorite
 */
export class ArticleSummaryDto {
  @ApiProperty({ description: 'Article slug', example: 'how-to-learn-nestjs' })
  @Expose()
  slug!: string;

  @ApiProperty({ description: 'Article title', example: 'How to Learn NestJS' })
  @Expose()
  title!: string;

  @ApiProperty({
    description: 'Number of users who favorited this article',
    example: 46,
  })
  @Expose()
  favoritesCount!: number;

  @ApiProperty({
    description: 'Whether current user has favorited this article',
    example: true,
  })
  @Expose()
  favorited!: boolean;
}
