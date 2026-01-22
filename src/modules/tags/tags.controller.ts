import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { BaseResponseDto } from '@/common/dto/response.dto';
import { Public } from '@modules/auth/decorators/public.decorator';
import { TagsService } from './tags.service';
import { TagResponseDto } from './dto/tag-response.dto';
import { TagDetailResponseDto } from './dto/tag-detail-response.dto';

/**
 * Tags Controller
 * Handles public tag operations
 * All endpoints are public (no authentication required)
 */
@ApiTags('tags')
@ApiExtraModels(TagResponseDto, TagDetailResponseDto, BaseResponseDto)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Get list of all tags
   * @returns List of all tags ordered alphabetically
   */
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all tags',
    description:
      'Returns all available tags ordered alphabetically by name. Each tag includes article count. Results are cached for optimal performance.',
  })
  @ApiOkResponse({
    description: 'List of all tags retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: { $ref: getSchemaPath(TagResponseDto) },
                },
              },
            },
          },
        },
      ],
    },
  })
  async findAll(): Promise<BaseResponseDto<{ tags: TagResponseDto[] }>> {
    const tags = await this.tagsService.findAll();
    return { success: true, data: { tags } };
  }

  /**
   * Get tag detail with recent articles
   * @param slug - Tag slug
   * @returns Tag detail with recent published articles (limit 20)
   */
  @Get(':slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'slug',
    description: 'Tag slug (URL-friendly identifier)',
    example: 'nestjs',
    type: String,
  })
  @ApiOperation({
    summary: 'Get tag details',
    description:
      'Returns tag information with recent published articles (limit 20). Articles are sorted by creation date (newest first). Results are cached.',
  })
  @ApiOkResponse({
    description: 'Tag detail retrieved successfully',
    schema: {
      allOf: [
        {
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: getSchemaPath(TagDetailResponseDto) },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Tag not found',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'NOT_FOUND' },
            message: {
              type: 'string',
              example: "Tag with slug 'xyz' not found",
            },
          },
        },
      },
    },
  })
  async findOne(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<TagDetailResponseDto>> {
    const data = await this.tagsService.findBySlug(slug);
    return { success: true, data };
  }
}
