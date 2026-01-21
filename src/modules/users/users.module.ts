import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { UsersService } from './users.service';
import { UsersController, ProfilesController } from './users.controller';

/**
 * Users Module
 * Manages user profile operations and public profiles
 */
@Module({
  imports: [DatabaseModule],
  controllers: [UsersController, ProfilesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
