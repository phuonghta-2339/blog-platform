import { Request } from 'express';
import { AuthenticatedUser } from '@modules/auth/interfaces/authenticated-user.interface';

/**
 * Request interface with authenticated user and comment info
 * Used by CommentAuthorGuard to attach comment data to request
 */
export interface RequestWithComment extends Request {
  user: AuthenticatedUser;
  params: {
    id: string; // article ID
    commentId: string;
  };
  comment?: {
    id: number;
    authorId: number;
    articleId: number;
  };
}
