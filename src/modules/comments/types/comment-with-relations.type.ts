import { Comment, User } from '@prisma/client';

/**
 * Comment with author relation
 * Used for service layer operations
 */
export type CommentWithRelations = Comment & {
  author: Pick<User, 'id' | 'username' | 'avatar'>;
};
