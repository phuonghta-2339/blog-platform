import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { TagsModule } from '@modules/tags/tags.module';
import { FollowsModule } from '@modules/follows/follows.module';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticleAuthorGuard } from './guards/article-author.guard';

/**
 * Articles Module
 * Manages article CRUD operations with pagination, filtering, and caching
 */
@Module({
  imports: [DatabaseModule, TagsModule, forwardRef(() => FollowsModule)],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleAuthorGuard],
  exports: [ArticlesService],
})
export class ArticlesModule {}
