import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthCheckResponseDto } from './common/dto/health-check.dto';
import { BaseResponseDto } from './common/dto/response.dto';

@ApiTags('health')
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Root endpoint',
    description: 'Returns API root information',
  })
  @ApiResponse({
    status: 200,
    description: 'Root endpoint accessed successfully',
    type: BaseResponseDto,
  })
  getRoot(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns the health status of the API including uptime and environment information',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    type: HealthCheckResponseDto,
  })
  getHealth(): HealthCheckResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: this.appService.getUptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
