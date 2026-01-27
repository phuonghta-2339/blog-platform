import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
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
import { FavoritesService } from './favorites.service';
import { FavoriteResponseDto } from './dto/favorite-response.dto';

/**
 * Favorites Controller
 * Handles favorite/unfavorite operations for articles
 * All operations are idempotent and safe to retry
 */
@ApiTags('favorites')
@ApiExtraModels(FavoriteResponseDto, BaseResponseDto)
@Controller('articles/:id/favorite')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * Favorite an article
   * Idempotent operation - safe to call multiple times
   * @param articleId - Article ID
   * @param user - Current authenticated user
   * @returns Article summary with updated favorite status
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Favorite an article',
    description:
      'Add article to favorites. Idempotent - safe to call multiple times. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Article favorited successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(FavoriteResponseDto) },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string', example: 'Authentication required' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Cannot favorite unpublished articles',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'BAD_REQUEST' },
            message: {
              type: 'string',
              example: 'Cannot favorite unpublished articles',
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'ARTICLE_NOT_FOUND' },
            message: { type: 'string', example: 'Article not found' },
          },
        },
      },
    },
  })
  async favorite(
    @Param('id', ParseIntPipe) articleId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<FavoriteResponseDto>> {
    const data = await this.favoritesService.favoriteArticle(
      articleId,
      user.id,
    );
    return { success: true, data };
  }

  /**
   * Unfavorite an article
   * Idempotent operation - safe to call multiple times
   * @param articleId - Article ID
   * @param user - Current authenticated user
   * @returns Article summary with updated favorite status
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Unfavorite an article',
    description:
      'Remove article from favorites. Idempotent - safe to call multiple times. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Article unfavorited successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(FavoriteResponseDto) },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string', example: 'Authentication required' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'ARTICLE_NOT_FOUND' },
            message: { type: 'string', example: 'Article not found' },
          },
        },
      },
    },
  })
  async unfavorite(
    @Param('id', ParseIntPipe) articleId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<FavoriteResponseDto>> {
    const data = await this.favoritesService.unfavoriteArticle(
      articleId,
      user.id,
    );
    return { success: true, data };
  }
}
