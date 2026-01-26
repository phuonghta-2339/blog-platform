import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
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
 * DTO for creating a new article
 */
export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'How to Learn NestJS',
    minLength: ARTICLE_TITLE_MIN_LENGTH,
    maxLength: ARTICLE_TITLE_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(ARTICLE_TITLE_MIN_LENGTH)
  @MaxLength(ARTICLE_TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({
    description: 'Short description or summary',
    example: 'A comprehensive guide to learning NestJS framework',
    minLength: ARTICLE_DESCRIPTION_MIN_LENGTH,
    maxLength: ARTICLE_DESCRIPTION_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(ARTICLE_DESCRIPTION_MIN_LENGTH)
  @MaxLength(ARTICLE_DESCRIPTION_MAX_LENGTH)
  description!: string;

  @ApiProperty({
    description: 'Full article content in markdown or plain text',
    example: 'Full article content here...',
    minLength: ARTICLE_BODY_MIN_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(ARTICLE_BODY_MIN_LENGTH)
  body!: string;

  @ApiProperty({
    description: 'Array of tag slugs to associate with the article',
    example: ['nestjs', 'backend', 'typescript'],
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
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
