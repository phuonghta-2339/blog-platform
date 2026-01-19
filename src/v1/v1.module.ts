import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ApiService } from './api/api.service';

/**
 * V1 Module - Contains all version 1 API endpoints
 * This modular approach allows easy version management and upgrades
 */
@Module({
  controllers: [ApiController],
  providers: [ApiService],
  exports: [],
})
export class V1Module {}
