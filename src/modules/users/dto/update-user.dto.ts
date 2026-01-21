import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_REGEX, USERNAME_REGEX } from '@modules/auth/constants/regex';

/**
 * DTO for updating user profile
 * All fields are optional - only provided fields will be updated
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'newemail@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @ApiPropertyOptional({
    description: 'Username (3-50 characters, alphanumeric + underscore)',
    example: 'johndoe_updated',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  @Matches(USERNAME_REGEX, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  username?: string;

  @ApiPropertyOptional({
    description:
      'New password (min 8 characters, at least 1 uppercase, 1 lowercase, 1 number)',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'User bio (max 500 characters)',
    example: 'Software developer and technical writer',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string' ? value.trim() || null : null,
  )
  bio?: string;

  @ApiPropertyOptional({
    description:
      'Avatar URL (max 1000 characters) - points to external storage',
    example: 'https://example.com/avatars/johndoe.jpg',
    maxLength: 1000,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  @MaxLength(1000, { message: 'Avatar URL must not exceed 1000 characters' })
  @Transform(({ value }: { value?: string }) =>
    typeof value === 'string' ? value.trim() || null : null,
  )
  avatar?: string;
}
