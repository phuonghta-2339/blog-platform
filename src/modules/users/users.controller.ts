import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { BaseResponseDto } from '@/common/dto/response.dto';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { AuthenticatedUser } from '@modules/auth/interfaces/authenticated-user.interface';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  FILE_SIZE_LIMITS,
} from '@modules/storage/constants/storage.constants';
import { ImageFileValidator } from '@modules/storage/validators/file.validator';
import { AvatarUploadResponseDto } from '@modules/storage/dto/avatar-upload-response.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PublicProfileDto } from './dto/public-profile.dto';

/**
 * Users Controller
 * Handles user profile operations
 */
@ApiTags('users')
@ApiExtraModels(
  UserResponseDto,
  PublicProfileDto,
  BaseResponseDto,
  AvatarUploadResponseDto,
)
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current authenticated user profile
   * @param user - Current authenticated user
   * @returns User profile with stats
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the profile of the currently authenticated user with statistics (followers, following, articles count)',
  })
  @ApiOkResponse({
    description: 'Current user profile retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiNotFoundResponse({ description: 'User not found or inactive' })
  async getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<UserResponseDto>> {
    const data = await this.usersService.getProfile(user.id);
    return { success: true, data };
  }

  /**
   * Update current user profile
   * @param user - Current authenticated user
   * @param updateUserDto - Fields to update
   * @returns Updated user profile
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Update profile information for the currently authenticated user. All fields are optional.',
  })
  @ApiOkResponse({
    description: 'User profile updated successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(UserResponseDto) },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - No fields to update, duplicate username/email, validation failed, incorrect current password, or missing current password when updating email/username',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<BaseResponseDto<UserResponseDto>> {
    const data = await this.usersService.updateProfile(user.id, updateUserDto);
    return { success: true, data };
  }

  /**
   * Upload user avatar
   * @param user - Current authenticated user
   * @param file - Uploaded image file
   * @returns Avatar upload result with URL and ID
   */
  @Post('avatar')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload user avatar',
    description:
      'Upload a profile avatar image. Supports JPG, JPEG, PNG, and WebP formats. Maximum file size is 5MB. Automatically replaces any existing avatar.',
  })
  @ApiBody({
    description: 'Avatar image file (single file only)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPG, JPEG, PNG, WebP, max 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({
    description: 'Avatar uploaded successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(AvatarUploadResponseDto) },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiBadRequestResponse({
    description:
      'Bad request - File is empty, invalid file type, file too large, multiple files uploaded, or upload failed',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1 } }))
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new ImageFileValidator({
            allowedMimeTypes: [...ALLOWED_IMAGE_MIME_TYPES],
            maxSizeBytes: FILE_SIZE_LIMITS.IMAGE,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<BaseResponseDto<AvatarUploadResponseDto>> {
    const data = await this.usersService.updateAvatar(user.id, file);
    return { success: true, data };
  }
}

/**
 * Profiles Controller
 * Handles public profile viewing
 */
@ApiTags('users')
@ApiExtraModels(PublicProfileDto, BaseResponseDto)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get public profile by username
   * @param username - Username to look up
   * @param user - Optional current user for following status
   * @returns Public profile
   */
  @Get(':username')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get public profile by username',
    description:
      'Returns public profile information for a specific user. Following status is included if authenticated. No authentication required.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username to look up',
    example: 'johndoe',
  })
  @ApiOkResponse({
    description: 'Public profile retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(PublicProfileDto) },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({ description: 'Bad request - Username is required' })
  @ApiNotFoundResponse({ description: 'User not found or inactive' })
  async getPublicProfile(
    @Param('username') username: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<BaseResponseDto<PublicProfileDto>> {
    const data = await this.usersService.getPublicProfile(username, user?.id);
    return { success: true, data };
  }
}
