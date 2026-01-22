import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../decorators/match.decorator';
import { PASSWORD_REGEX, USERNAME_REGEX } from '../constants/regex';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '@common/constants/validation';

/**
 * Data Transfer Object for user registration
 * Contains validation rules for creating a new user account
 */
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    description: 'Username (3-50 characters, alphanumeric + underscore)',
    example: 'johndoe',
    minLength: USERNAME_MIN_LENGTH,
    maxLength: USERNAME_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(USERNAME_MIN_LENGTH, {
    message: 'Username must be at least 3 characters',
  })
  @MaxLength(USERNAME_MAX_LENGTH, {
    message: 'Username must not exceed 50 characters',
  })
  @Matches(USERNAME_REGEX, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username!: string;

  @ApiProperty({
    description:
      'Password (8-128 characters, at least 1 uppercase, 1 lowercase, 1 number)',
    example: 'SecurePass123!',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: 'Password must be at least 8 characters',
  })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: 'Password must not exceed 128 characters',
  })
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  password!: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'SecurePass123!',
    minLength: PASSWORD_MIN_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password confirmation is required' })
  @Match('password', { message: 'Passwords do not match' })
  passwordConfirmation!: string;
}
