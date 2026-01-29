/**
 * Mail Preview Directory Path
 */
export const MAIL_PREVIEW_DIR = 'src/modules/mail/templates/preview';

/**
 * Mail Preview Types
 */
export const MAIL_PREVIEW_TYPES = {
  WELCOME: 'welcome',
  NEW_FOLLOWER: 'new-follower',
  ALL: 'all',
} as const;

/**
 * Mail Test Types
 */
export const MAIL_TEST_TYPES = {
  WELCOME: 'welcome',
  NEW_FOLLOWER: 'new-follower',
} as const;

/**
 * Preview Configuration Data
 */
export const MAIL_PREVIEW_CONFIG = {
  WELCOME: {
    data: {
      username: 'John Doe',
      loginUrl: 'http://localhost:3000/auth/login',
    },
    filename: 'preview-welcome.html',
  },
  NEW_FOLLOWER: {
    data: {
      authorName: 'Jane Smith',
      followerName: 'Alice Johnson',
      profileUrl: 'http://localhost:3000/profile/alice-johnson',
    },
    filename: 'preview-new-follower.html',
  },
} as const;

/**
 * Test Configuration Data
 */
export const MAIL_TEST_CONFIG = {
  WELCOME: {
    username: 'TestUser',
    loginUrl: 'http://localhost:3000/auth/login',
    subject: '[TEST] Welcome to Blog Platform',
  },
  NEW_FOLLOWER: {
    authorName: 'TestAuthor',
    followerName: 'TestFollower',
    profileUrl: 'http://localhost:3000/profile/testfollower',
    subject: '[TEST] You Have a New Follower!',
  },
} as const;
