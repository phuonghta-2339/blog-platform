import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
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
import { AuthenticatedUser } from '@modules/auth/interfaces/authenticated-user.interface';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { PaginatedArticlesDto } from './dto/paginated-articles.dto';
import { ArticleAuthorGuard } from './guards/article-author.guard';

/**
 * Request interface with article attached by guard
 */
interface RequestWithArticle extends Request {
  article?: {
    id: number;
    authorId: number;
    slug: string;
  };
}

/**
 * Articles Controller
 * Handles article CRUD operations with pagination and filtering
 */
@ApiTags('articles')
@ApiExtraModels(ArticleResponseDto, PaginatedArticlesDto, BaseResponseDto)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * Get list of articles with filters
   * Public endpoint - shows only published articles
   * @param query - Query parameters (filters, pagination, sorting)
   * @param user - Current authenticated user (optional)
   * @returns Paginated list of articles
   */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get list of articles',
    description:
      'Get paginated list of published articles with optional filters (tag, author, favorited). Public access.',
  })
  @ApiOkResponse({
    description: 'Articles retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(PaginatedArticlesDto) },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() query: ArticleQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<BaseResponseDto<PaginatedArticlesDto>> {
    const data = await this.articlesService.findAll(query, user?.id);
    return { success: true, data };
  }

  /**
   * Get personal feed from followed users
   * Authenticated users only
   * @param query - Pagination parameters
   * @param user - Current authenticated user
   * @returns Paginated list of articles from followed users
   */
  @Get('feed')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get personal feed',
    description:
      'Get paginated list of published articles from users you follow. Authenticated users only.',
  })
  @ApiOkResponse({
    description: 'Feed retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(PaginatedArticlesDto) },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getFeed(
    @Query() query: ArticleQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<PaginatedArticlesDto>> {
    const { limit, offset } = query;
    const data = await this.articlesService.getFeed(user.id, limit, offset);
    return { success: true, data };
  }

  /**
   * Get single article by slug
   * Public endpoint
   * @param slug - Article slug
   * @param user - Current authenticated user (optional)
   * @returns Article details
   */
  @Get(':slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'slug',
    description: 'Article slug',
    example: 'how-to-learn-nestjs',
  })
  @ApiOperation({
    summary: 'Get article by slug',
    description: 'Get single article details by slug. Public access.',
  })
  @ApiOkResponse({
    description: 'Article retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(ArticleResponseDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({ description: 'Article not found' })
  async findOne(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<BaseResponseDto<ArticleResponseDto>> {
    const data = await this.articlesService.findOne(slug, user?.id);
    return { success: true, data };
  }

  /**
   * Create a new article
   * @param createDto - Article creation data
   * @param user - Current authenticated user
   * @returns Created article
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Create a new article',
    description:
      'Create a new article with tags. Slug is auto-generated from title. Authenticated users only.',
  })
  @ApiCreatedResponse({
    description: 'Article created successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(ArticleResponseDto) },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or slug already exists',
  })
  async create(
    @Body() createDto: CreateArticleDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BaseResponseDto<ArticleResponseDto>> {
    const data = await this.articlesService.create(createDto, user.id);
    return { success: true, data };
  }

  /**
   * Update article
   * Author or admin only
   * @param id - Article ID
   * @param updateDto - Update data
   * @param user - Current authenticated user
   * @returns Updated article
   */
  @Put(':id')
  @UseGuards(ArticleAuthorGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: 1,
    type: 'integer',
  })
  @ApiOperation({
    summary: 'Update article',
    description:
      'Update article by ID. Only article author or admin can update. Slug is regenerated if title changes.',
  })
  @ApiOkResponse({
    description: 'Article updated successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(ArticleResponseDto) },
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Not article author or admin',
  })
  @ApiNotFoundResponse({ description: 'Article not found' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateArticleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithArticle,
  ): Promise<BaseResponseDto<ArticleResponseDto>> {
    // Guard has already verified article exists and attached it to request
    const articleId = request.article?.id;
    if (!articleId) {
      throw new Error('Article not found in request after guard validation');
    }

    const data = await this.articlesService.update(
      articleId,
      updateDto,
      user.id,
    );
    return { success: true, data };
  }

  /**
   * Delete article
   * Author or admin only
   * @param id - Article ID
   * @param user - Current authenticated user
   * @returns Success message
   */
  @Delete(':id')
  @UseGuards(ArticleAuthorGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer')
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: 1,
    type: 'integer',
  })
  @ApiOperation({
    summary: 'Delete article',
    description:
      'Delete article by ID. Only article author or admin can delete.',
  })
  @ApiOkResponse({
    description: 'Article deleted successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Article deleted successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Not article author or admin',
  })
  @ApiNotFoundResponse({ description: 'Article not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: RequestWithArticle,
  ): Promise<{ success: boolean; message: string }> {
    // Guard has already verified article exists and attached it to request
    const articleId = request.article?.id;
    const articleSlug = request.article?.slug;
    if (!articleId || !articleSlug) {
      throw new Error('Article not found in request after guard validation');
    }

    await this.articlesService.delete(articleId, articleSlug);
    return { success: true, message: 'Article deleted successfully' };
  }
}
