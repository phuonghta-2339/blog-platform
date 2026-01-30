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
  ADMIN_DAILY_REPORT: 'admin-daily-report',
  ALL: 'all',
} as const;

/**
 * Mail Test Types
 */
export const MAIL_TEST_TYPES = {
  WELCOME: 'welcome',
  NEW_FOLLOWER: 'new-follower',
  ADMIN_DAILY_REPORT: 'admin-daily-report',
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
  ADMIN_DAILY_REPORT: {
    data: {
      date: '2024-03-20',
      totalLikesGained: 1250,
      topArticles: [
        {
          rank: 1,
          title: 'Mastering NestJS Microservices',
          allTimeLikes: 5420,
          likesGained: 154,
        },
        {
          rank: 2,
          title: 'Advanced Prisma 101',
          allTimeLikes: 3210,
          likesGained: 98,
        },
        {
          rank: 3,
          title: 'Clean Architecture in TypeScript',
          allTimeLikes: 2150,
          likesGained: 76,
        },
        {
          rank: 4,
          title: 'The Future of AI in Coding',
          allTimeLikes: 1840,
          likesGained: 52,
        },
        {
          rank: 5,
          title: 'Optimizing Redis Performance',
          allTimeLikes: 1205,
          likesGained: 34,
        },
      ],
    },
    filename: 'preview-admin-daily-report.html',
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
  ADMIN_DAILY_REPORT: {
    date: new Date().toISOString().split('T')[0],
    totalLikesGained: 780,
    topArticles: [
      {
        rank: 1,
        title: 'Sample Test Article',
        allTimeLikes: 500,
        likesGained: 25,
      },
    ],
    subject: '[TEST] Daily Activity Report',
  },
} as const;
