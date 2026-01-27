import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
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
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';
import { AuthenticatedUser } from '@modules/auth/interfaces/authenticated-user.interface';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { PaginatedCommentsDto } from './dto/paginated-comments.dto';
import { CommentAuthorGuard } from './guards/comment-author.guard';

/**
 * Comments Controller
 * Handles CR-D operations for article comments
 */
@ApiTags('comments')
@ApiExtraModels(CommentResponseDto, PaginatedCommentsDto, BaseResponseDto)
@Controller('articles/:id/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Get list of comments for an article
   * Public endpoint with optional authentication for personalization
   * @param articleId - Article ID
   * @param query - Query parameters (pagination)
   * @param user - Current authenticated user (optional, available if JWT provided)
   * @returns Paginated list of comments
   */
  @Get()
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get list of comments for an article',
    description:
      'Get paginated list of comments for a specific article. Public access with optional personalization for authenticated users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Comments retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(PaginatedCommentsDto) },
          },
        },
      ],
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
  async findAll(
    @Param('id', ParseIntPipe) articleId: number,
    @Query() query: CommentQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<BaseResponseDto<PaginatedCommentsDto>> {
    const data = await this.commentsService.findAll(articleId, query, user?.id);
    return { success: true, data };
  }

  /**
   * Create a new comment on an article
   * Authenticated users only
   * @param articleId - Article ID
   * @param createDto - Comment creation data
   * @param user - Current authenticated user
   * @returns Created comment
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Create a new comment on an article',
    description:
      'Create a new comment on a published article. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: 1,
    type: Number,
  })
  @ApiCreatedResponse({
    description: 'Comment created successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(CommentResponseDto) },
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
    description: 'Validation failed or cannot comment on unpublished articles',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Validation failed' },
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
  async create(
    @Param('id', ParseIntPipe) articleId: number,
    @Body() createDto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<CommentResponseDto>> {
    const data = await this.commentsService.create(
      articleId,
      createDto,
      user.id,
    );
    return { success: true, data };
  }

  /**
   * Delete a comment
   * Author or admin only (protected by CommentAuthorGuard)
   * @param articleId - Article ID
   * @param commentId - Comment ID
   * @returns Success message
   */
  @Delete(':commentId')
  @UseGuards(CommentAuthorGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Delete a comment',
    description:
      'Delete a comment. Only the comment author or admin can delete.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: 1,
    type: Number,
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID to delete',
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Comment deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Comment deleted successfully' },
      },
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
  @ApiForbiddenResponse({
    description: 'Cannot delete other users comments',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'FORBIDDEN' },
            message: {
              type: 'string',
              example: 'You can only delete your own comments',
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'COMMENT_NOT_FOUND' },
            message: { type: 'string', example: 'Comment not found' },
          },
        },
      },
    },
  })
  async delete(
    @Param('id', ParseIntPipe) articleId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.commentsService.delete(articleId, commentId);
    return { success: true, message: 'Comment deleted successfully' };
  }
}
