/**
 * Cloudinary constants
 */
export const CLOUDINARY_CONSTANTS = {
  MODULE_NAME: 'cloudinary',
  FOLDER_PREFIX: 'blog_platform',
  RESOURCE_TYPE: 'image',
  DELETE_RESULTS: {
    OK: 'ok',
    NOT_FOUND: 'not found',
  },
  ERROR_MESSAGES: {
    NOT_INITIALIZED:
      'Cloudinary client not initialized. Please configure credentials or install cloudinary package.',
    UPLOAD_FAILED: 'Failed to upload to Cloudinary',
    DELETE_FAILED: 'Failed to delete from Cloudinary',
    NO_RESULT: 'Cloudinary upload returned no result',
  },
  TRANSFORMATION_AVATAR: {
    width: 400,
    height: 400,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
  TRANSFORMATION_ARTICLE: {
    width: 1200,
    height: 630,
    crop: 'fill',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
} as const;
