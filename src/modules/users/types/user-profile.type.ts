/**
 * User profile data type
 * Used for profile responses and follow list items
 */
export type UserProfileData = {
  id: number;
  username: string;
  bio: string | null;
  avatar: string | null;
  _count: {
    followers: number;
  };
};

/**
 * Minimal user data for profile display
 */
export type UserBasicProfile = Pick<
  UserProfileData,
  'username' | 'bio' | 'avatar'
> & {
  _count?: { followers: number };
};
