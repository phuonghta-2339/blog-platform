import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

/**
 * Tags Module
 * Manages read-only tag operations with caching
 * Note: CacheModule is global, no need to import here
 */
@Module({
  imports: [DatabaseModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
