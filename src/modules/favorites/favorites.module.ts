import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { ArticlesModule } from '@modules/articles/articles.module';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';

/**
 * Favorites Module
 * Manages favorite/unfavorite operations with idempotent design
 */
@Module({
  imports: [DatabaseModule, ArticlesModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
