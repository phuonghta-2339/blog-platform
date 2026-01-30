/**
 * Storage configuration
 * Supports multiple storage providers (local, cloudinary)
 */

import { registerAs } from '@nestjs/config';
import { LOCAL_STORAGE_CONFIG } from '@/modules/storage/constants/storage.constants';
import { StorageProviderType } from '@/common/constants/providers';

export const storageConfig = registerAs('storage', () => ({
  // Provider selection
  provider: (
    process.env.STORAGE_PROVIDER || StorageProviderType.MULTER
  ).toLowerCase(),
  // Local storage configuration
  local: {
    uploadDir: process.env.LOCAL_UPLOAD_DIR || LOCAL_STORAGE_CONFIG.UPLOAD_DIR,
    urlPrefix: process.env.LOCAL_URL_PREFIX || LOCAL_STORAGE_CONFIG.URL_PREFIX,
  },
  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  },
}));
