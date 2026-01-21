import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DEFAULT_COUNT } from '@common/constants/validation';

/**
 * DTO for tag response
 * Returns basic tag information with article count
 */
@Exclude()
export class TagResponseDto {
  @ApiProperty({
    description: 'Tag ID',
    example: 1,
    type: Number,
  })
  @Expose()
  id!: number;

  @ApiProperty({
    description: 'Tag name',
    example: 'NestJS',
    type: String,
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'Tag slug (URL-friendly)',
    example: 'nestjs',
    type: String,
  })
  @Expose()
  slug!: string;

  @ApiProperty({
    description: 'Number of articles with this tag',
    example: 25,
    type: Number,
    default: DEFAULT_COUNT,
  })
  @Expose()
  articlesCount!: number;

  @ApiProperty({
    description: 'Tag creation date',
    example: '2026-01-14T10:00:00.000Z',
    type: Date,
  })
  @Expose()
  createdAt!: Date;
}
