import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { UsersModule } from '@modules/users/users.module';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';

/**
 * Follows Module
 * Manages follow/unfollow operations with pagination and caching
 */
@Module({
  imports: [DatabaseModule, forwardRef(() => UsersModule)],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
