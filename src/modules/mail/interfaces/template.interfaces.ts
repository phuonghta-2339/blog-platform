/**
 * Base properties for all email layouts
 */
export interface BaseLayoutProps {
  title: string;
  previewText?: string;
  headerEmoji?: string;
  headerTitle: string;
  contentHtml: string;
}

/**
 * Variables for the Welcome Email template
 */
export interface WelcomeEmailVars {
  username: string;
  loginUrl: string;
}

/**
 * Variables for the New Follower notification template
 */
export interface NewFollowerEmailVars {
  followerName: string;
  profileUrl: string;
  authorName: string;
}

/**
 * Common return type for all template renderers
 */
export interface RenderedEmail {
  html: string;
  text: string;
}
