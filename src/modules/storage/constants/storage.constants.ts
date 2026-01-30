/**
 * Storage constants
 * Contains file upload configuration and constraints
 */

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'svg',
  'ico',
] as const;

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

/**
 * Allowed document MIME types (for future extension)
 */
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  MIN_SIZE: 1, // 1 byte (prevent empty files)
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024, // 50MB
} as const;

/**
 * Local storage configuration
 */
export const LOCAL_STORAGE_CONFIG = {
  UPLOAD_DIR: './public/uploads',
  URL_PREFIX: '/uploads',
  ALLOWED_EXTENSIONS,
} as const;

/**
 * Default folder paths
 */
export const DEFAULT_FOLDERS = {
  AVATARS: 'avatars',
  ARTICLES: 'articles',
  DOCUMENTS: 'documents',
} as const;

/**
 * File upload field names
 */
export const FILE_FIELD_NAMES = {
  AVATAR: 'file',
  ARTICLE_IMAGE: 'image',
  DOCUMENT: 'document',
} as const;

/**
 * Max number of files for multiple upload
 */
export const MAX_FILE_COUNT = {
  SINGLE: 1,
  MULTIPLE_IMAGES: 10,
  MULTIPLE_DOCUMENTS: 5,
} as const;

/**
 * Storage Regex Patterns
 */
export const STORAGE_REGEX = {
  /**
   * Removes leading and trailing slashes
   * Used for cleaning folder paths
   */
  REMOVE_SLASHES: /^\/+|\/+$/g,

  /**
   * Replaces non-alphanumeric chars (except . and -) with _
   * Used for sanitizing filenames
   */
  SANITIZE_FILENAME: /[^a-zA-Z0-9.-]/g,

  /**
   * Detects path traversal patterns (.. followed by / or \)
   * Used for security validation of paths
   */
  PATH_TRAVERSAL: /^(\.\.(\/|\\|$))+/,

  /**
   * Matches the file extension at the end of a string
   * Used for stripping extensions from filenames/public IDs
   */
  STRIP_EXTENSION: /\.[^/.]+$/,
} as const;
