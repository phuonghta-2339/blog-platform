import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import {
  COMMENT_BODY_MIN_LENGTH,
  COMMENT_BODY_MAX_LENGTH,
} from '@common/constants/validation';

/**
 * DTO for creating a new comment
 */
export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment text content',
    example: 'Great article! Very helpful.',
    minLength: COMMENT_BODY_MIN_LENGTH,
    maxLength: COMMENT_BODY_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(COMMENT_BODY_MIN_LENGTH)
  @MaxLength(COMMENT_BODY_MAX_LENGTH)
  body!: string;
}
