import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { TagsModule } from '@modules/tags/tags.module';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticleAuthorGuard } from './guards/article-author.guard';

/**
 * Articles Module
 * Manages article CRUD operations with pagination, filtering, and caching
 */
@Module({
  imports: [DatabaseModule, TagsModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleAuthorGuard],
  exports: [ArticlesService],
})
export class ArticlesModule {}
