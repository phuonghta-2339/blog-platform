import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuthenticatedUser } from '@modules/auth/interfaces/authenticated-user.interface';
import { Role } from '@prisma/client';

/**
 * Article Author Guard
 * Verifies that the current user is the article author or an admin
 * Used for protecting update and delete operations
 */
@Injectable()
export class ArticleAuthorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
      params: { id: string };
      article?: { id: number; authorId: number; slug: string };
    }>();
    const user = request.user;
    const id = parseInt(request.params.id, 10);

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (isNaN(id)) {
      throw new NotFoundException('Invalid article ID');
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
