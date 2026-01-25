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
import { AuthenticatedUser } from '@modules/auth/interfaces/authenticated-user.interface';
import { Role } from '@prisma/client';

/**
 * Article Author Guard
 * Verifies that the current user is the article author or an admin
 * Used for protecting update and delete operations
 * Logs privileged admin actions for audit and security purposes
 */
@Injectable()
export class ArticleAuthorGuard implements CanActivate {
  private readonly logger = new Logger(ArticleAuthorGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
      params: { id: string };
      article?: { id: number; authorId: number; slug: string };
    }>();
    const user = request.user;
    const idParam = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Parse and validate id parameter
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid article ID');
    }

    // Check if article exists and get id + authorId + slug
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { id: true, authorId: true, slug: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Admin can update/delete any article
    if (user.role === Role.ADMIN) {
      // Log privileged admin action for audit purposes
      if (article.authorId !== user.id) {
        const httpRequest = context
          .switchToHttp()
          .getRequest<{ method: string }>();
        const action = httpRequest.method === 'PUT' ? 'update' : 'delete';
        this.logger.warn(
          `Admin user (id=${user.id}) is performing privileged ${action} ` +
            `on article (id=${article.id}) owned by user (id=${article.authorId})`,
        );
      }
      // Attach article to request for controller use
      request.article = article;
      return true;
    }

    // Check if user is the author
    if (article.authorId !== user.id) {
      throw new ForbiddenException('You can only modify your own articles');
    }

    // Attach article to request for controller use
    request.article = article;
    return true;
  }
}
