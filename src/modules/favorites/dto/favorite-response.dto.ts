import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ArticleSummaryDto } from './article-summary.dto';

// Re-export for convenience
export { ArticleSummaryDto } from './article-summary.dto';

/**
 * Favorite Response DTO
 * Returned after favorite/unfavorite operations
 */
export class FavoriteResponseDto {
  @ApiProperty({
    description: 'Article summary with updated favorite status',
    type: ArticleSummaryDto,
  })
  @Expose()
  @Type(() => ArticleSummaryDto)
  article!: ArticleSummaryDto;
}
