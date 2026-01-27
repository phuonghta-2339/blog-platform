import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Role } from '@prisma/client';
import { RequestWithComment } from '../interfaces/request-with-comment.interface';

/**
 * Comment Author Guard
 * Verifies that the current user is the comment author or an admin
 * Used for protecting delete operations
 * Logs privileged admin actions for audit and security purposes
 */
@Injectable()
export class CommentAuthorGuard implements CanActivate {
  private readonly logger = new Logger(CommentAuthorGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithComment>();
    const user = request.user;
    const commentIdParam = request.params.commentId;
    const articleIdParam = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Parse and validate commentId parameter
    const commentId = parseInt(commentIdParam, 10);
    if (isNaN(commentId) || commentId <= 0) {
      throw new BadRequestException('Invalid comment ID');
    }

    // Parse and validate articleId parameter
    const articleId = parseInt(articleIdParam, 10);
    if (isNaN(articleId) || articleId <= 0) {
      throw new BadRequestException('Invalid article ID');
    }

    // Check if comment exists and get id + authorId + articleId
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, articleId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Validate route consistency: ensure comment belongs to the specified article
    if (comment.articleId !== articleId) {
      throw new NotFoundException('Comment not found for this article');
    }

    // Admin can delete any comment
    if (user.role === Role.ADMIN) {
      // Log privileged admin action for audit purposes
      if (comment.authorId !== user.id) {
        this.logger.warn(
          `Admin user (id=${user.id}) is performing privileged delete ` +
            `on comment (id=${comment.id}) owned by user (id=${comment.authorId})`,
        );
      }
      // Attach comment to request for controller use
      request.comment = comment;
      return true;
    }

    // Check if user is the author
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Attach comment to request for controller use
    request.comment = comment;
    return true;
  }
}
