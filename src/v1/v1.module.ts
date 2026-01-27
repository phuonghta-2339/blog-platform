import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { ApiService } from './api/api.service';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { TagsModule } from '@modules/tags/tags.module';
import { ArticlesModule } from '@modules/articles/articles.module';
import { CommentsModule } from '@modules/comments/comments.module';
import { FavoritesModule } from '@modules/favorites/favorites.module';
import { FollowsModule } from '@modules/follows/follows.module';

/**
 * V1 Module - Contains all version 1 API endpoints
 * This modular approach allows easy version management and upgrades
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    TagsModule,
    ArticlesModule,
    CommentsModule,
    FavoritesModule,
    FollowsModule,
  ],
  controllers: [ApiController],
  providers: [ApiService],
  exports: [],
})
export class V1Module {}
