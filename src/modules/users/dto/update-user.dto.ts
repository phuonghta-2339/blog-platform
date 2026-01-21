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
import {
  AVATAR_URL_MAX_LENGTH,
  BIO_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '@common/constants/validation';
import {
  transformEmail,
  transformToLowerCase,
  transformToTrimmedOrNull,
} from '@common/helpers/transform.helper';

/**
 * DTO for updating user profile
 * All fields are optional - only provided fields will be updated
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'newemail@example.com',
    maxLength: EMAIL_MAX_LENGTH,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(EMAIL_MAX_LENGTH, {
    message: 'Email must not exceed 255 characters',
  })
  @Transform(({ value }) => transformEmail(value))
  email?: string;

  @ApiPropertyOptional({
    description: 'Username (3-50 characters, alphanumeric + underscore)',
    example: 'johndoe_updated',
    minLength: USERNAME_MIN_LENGTH,
    maxLength: USERNAME_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MinLength(USERNAME_MIN_LENGTH, {
    message: 'Username must be at least 3 characters',
  })
  @MaxLength(USERNAME_MAX_LENGTH, {
    message: 'Username must not exceed 50 characters',
  })
  @Matches(USERNAME_REGEX, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }) => transformToLowerCase(value))
  username?: string;

  @ApiPropertyOptional({
    description:
      'New password (min 8 characters, at least 1 uppercase, 1 lowercase, 1 number)',
    example: 'NewPassword123!',
    minLength: PASSWORD_MIN_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: 'Password must be at least 8 characters',
  })
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'User bio (max 500 characters)',
    example: 'Software developer and technical writer',
    maxLength: BIO_MAX_LENGTH,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(BIO_MAX_LENGTH, {
    message: 'Bio must not exceed 500 characters',
  })
  @Transform(({ value }) => transformToTrimmedOrNull(value))
  bio?: string | null;

  @ApiPropertyOptional({
    description:
      'Avatar URL (max 1000 characters) - points to external storage',
    example: 'https://example.com/avatars/johndoe.jpg',
    maxLength: AVATAR_URL_MAX_LENGTH,
    nullable: true,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  @MaxLength(AVATAR_URL_MAX_LENGTH, {
    message: 'Avatar URL must not exceed 1000 characters',
  })
  @Transform(({ value }) => transformToTrimmedOrNull(value))
  avatar?: string | null;
}
