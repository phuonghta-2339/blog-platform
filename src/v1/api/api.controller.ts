import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiService } from './api.service';

/**
 * API Controller for Version 1
 * Handles version-specific endpoints
 * Path: /api/v1
 */
@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('welcome')
  @ApiOperation({
    summary: 'Welcome message for v1',
    description: 'Returns a welcome message for API version 1',
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome message retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Welcome to Blog Platform API v1!',
        },
      },
    },
  })
  getWelcome() {
    return {
      message: this.apiService.getWelcome(),
    };
  }
}
