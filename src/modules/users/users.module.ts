import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { FollowsModule } from '@modules/follows/follows.module';
import { StorageModule } from '@modules/storage/storage.module';
import { UsersService } from './users.service';
import { UsersController, ProfilesController } from './users.controller';

/**
 * Users Module
 * Manages user profile operations and public profiles
 */
@Module({
  imports: [DatabaseModule, forwardRef(() => FollowsModule), StorageModule],
  controllers: [UsersController, ProfilesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
