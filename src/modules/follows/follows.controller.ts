import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { AuthenticatedUser } from '@modules/auth/interfaces/authenticated-user.interface';
import { FollowsService } from './follows.service';
import { FollowResponseDto } from './dto/follow-response.dto';
import { FollowListQueryDto } from './dto/follow-list-query.dto';
import { PaginatedFollowsDto } from './dto/paginated-follows.dto';

/**
 * Follows Controller
 * Handles follow/unfollow operations and followers/following lists
 */
@ApiTags('follows')
@ApiExtraModels(FollowResponseDto, PaginatedFollowsDto, BaseResponseDto)
@Controller('profiles/:username')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  /**
   * Follow a user
   * Idempotent operation - safe to retry
   * @param username - Username to follow
   * @param user - Current authenticated user
   * @returns Profile with updated following status
   */
  @Post('follow')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Follow a user',
    description:
      'Follow a user by username. Idempotent - safe to call multiple times. Cannot follow yourself.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username of the user to follow',
    example: 'janedoe',
  })
  @ApiOkResponse({
    description: 'User followed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(FollowResponseDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      example: {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: "User 'janedoe' not found",
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Cannot follow yourself',
    schema: {
      example: {
        success: false,
        error: {
          code: 'CANNOT_FOLLOW_SELF',
          message: 'You cannot follow yourself',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async followUser(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<FollowResponseDto>> {
    const data = await this.followsService.followUser(user.id, username);
    return { success: true, data };
  }

  /**
   * Unfollow a user
   * Idempotent operation - safe to retry
   * @param username - Username to unfollow
   * @param user - Current authenticated user
   * @returns Profile with updated following status
   */
  @Delete('follow')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Unfollow a user',
    description:
      'Unfollow a user by username. Idempotent - safe to call multiple times.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username of the user to unfollow',
    example: 'janedoe',
  })
  @ApiOkResponse({
    description: 'User unfollowed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(FollowResponseDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Cannot unfollow yourself',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async unfollowUser(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<FollowResponseDto>> {
    const data = await this.followsService.unfollowUser(user.id, username);
    return { success: true, data };
  }

  /**
   * Get followers list
   * @param username - Username to get followers for
   * @param user - Current authenticated user
   * @param query - Pagination options
   * @returns Paginated list of followers with following status
   */
  @Get('followers')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: "Get user's followers",
    description:
      'Get paginated list of followers for a user. Includes whether current user is following each follower.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username to get followers for',
    example: 'janedoe',
  })
  @ApiOkResponse({
    description: 'Followers retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(PaginatedFollowsDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getFollowers(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FollowListQueryDto,
  ): Promise<BaseResponseDto<PaginatedFollowsDto>> {
    const data = await this.followsService.getFollowers(
      username,
      user.id,
      query,
    );
    return { success: true, data };
  }

  /**
   * Get following list
   * @param username - Username to get following for
   * @param user - Current authenticated user
   * @param query - Pagination options
   * @returns Paginated list of users being followed with following status
   */
  @Get('following')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get users that this user is following',
    description:
      'Get paginated list of users that this user is following. Includes whether current user is following each user.',
  })
  @ApiParam({
    name: 'username',
    description: 'Username to get following list for',
    example: 'janedoe',
  })
  @ApiOkResponse({
    description: 'Following list retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(PaginatedFollowsDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getFollowing(
    @Param('username') username: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FollowListQueryDto,
  ): Promise<BaseResponseDto<PaginatedFollowsDto>> {
    const data = await this.followsService.getFollowing(
      username,
      user.id,
      query,
    );
    return { success: true, data };
  }
}
