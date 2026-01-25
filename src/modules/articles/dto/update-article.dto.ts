import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import {
  ARTICLE_TITLE_MIN_LENGTH,
  ARTICLE_TITLE_MAX_LENGTH,
  ARTICLE_DESCRIPTION_MIN_LENGTH,
  ARTICLE_DESCRIPTION_MAX_LENGTH,
  ARTICLE_BODY_MIN_LENGTH,
  ARTICLE_TAG_LIST_MAX_SIZE,
} from '@common/constants/validation';

/**
 * DTO for updating an existing article
 * All fields are optional, but at least one field must be provided for update
 * Validation is performed in the service layer to ensure empty updates are rejected
 */
export class UpdateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'Updated Title',
    minLength: ARTICLE_TITLE_MIN_LENGTH,
    maxLength: ARTICLE_TITLE_MAX_LENGTH,
    required: false,
  })
  @IsString()
  @MinLength(ARTICLE_TITLE_MIN_LENGTH)
  @MaxLength(ARTICLE_TITLE_MAX_LENGTH)
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Short description or summary',
    example: 'Updated description',
    minLength: ARTICLE_DESCRIPTION_MIN_LENGTH,
    maxLength: ARTICLE_DESCRIPTION_MAX_LENGTH,
    required: false,
  })
  @IsString()
  @MinLength(ARTICLE_DESCRIPTION_MIN_LENGTH)
  @MaxLength(ARTICLE_DESCRIPTION_MAX_LENGTH)
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Full article content',
    example: 'Updated content...',
    minLength: ARTICLE_BODY_MIN_LENGTH,
    required: false,
  })
  @IsString()
  @MinLength(ARTICLE_BODY_MIN_LENGTH)
  @IsOptional()
  body?: string;

  @ApiProperty({
    description: 'Array of tag slugs to associate with the article',
    example: ['nestjs', 'typescript'],
    required: false,
    type: [String],
    maxItems: ARTICLE_TAG_LIST_MAX_SIZE,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(ARTICLE_TAG_LIST_MAX_SIZE)
  @IsOptional()
  tagList?: string[];

  @ApiProperty({
    description: 'Whether the article is published or draft',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
