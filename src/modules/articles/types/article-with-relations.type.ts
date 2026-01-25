import { Article } from '@prisma/client';

/**
 * Type definition for Article with all required relations
 * Used for consistent type safety across article service methods
 */
export type ArticleWithRelations = Article & {
  author: {
    id: number;
    username: string;
    bio: string | null;
    avatar: string | null;
  };
  tags: Array<{
    tag: {
      id: number;
      name: string;
      slug: string;
    };
  }>;
  favorites?: Array<{ userId: number }>;
  _count?: {
    favorites: number;
    comments: number;
  };
};
