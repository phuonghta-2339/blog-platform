import { Request } from 'express';

/**
 * Request interface with article attached by ArticleAuthorGuard
 *
 * This interface extends the Express Request type to include the article
 * property that is attached by the ArticleAuthorGuard after verifying
 * article existence and ownership.
 */
export interface RequestWithArticle extends Request {
  article?: {
    id: number;
    authorId: number;
    slug: string;
  };
}
