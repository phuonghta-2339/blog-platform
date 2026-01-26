import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentAuthorGuard } from './guards/comment-author.guard';

/**
 * Comments Module
 * Manages CR-D operations for article comments with transaction safety
 */
@Module({
  imports: [DatabaseModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentAuthorGuard],
  exports: [CommentsService],
})
export class CommentsModule {}
