import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Avatar Upload Response DTO
 * Returned after successful avatar upload
 */
export class AvatarUploadResponseDto {
  @ApiProperty({
    description: 'Publicly accessible URL of the uploaded avatar',
    example:
      'https://res.cloudinary.com/demo/image/upload/v1/avatars/user_123.jpg',
  })
  @Expose()
  url!: string;

  @ApiProperty({
    description: 'Provider-specific unique identifier (used for deletion)',
    example: 'avatars/user_123_1706598400000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Timestamp of when the avatar was updated',
    example: '2024-01-30T12:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
