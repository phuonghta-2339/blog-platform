import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { DEFAULT_FOLLOWING_STATUS } from '@common/constants/validation';

/**
 * Author DTO for comment response
 */
export class CommentAuthorDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @Expose()
  username!: string;

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
 * Comment Response DTO
 */
export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID', example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({
    description: 'Comment text content',
    example: 'Great article! Very helpful.',
  })
  @Expose()
  body!: string;

  @ApiProperty({ description: 'Article ID', example: 1 })
  @Expose()
  articleId!: number;

  @ApiProperty({
    description: 'Comment author information',
    type: CommentAuthorDto,
  })
  @Expose()
  author!: CommentAuthorDto;

  @ApiProperty({
    description: 'Comment creation timestamp',
    example: '2026-01-14T10:30:00.000Z',
  })
  @Expose()
  createdAt!: Date;
}
