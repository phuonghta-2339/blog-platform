import { UploadApiOptions } from 'cloudinary';

/**
 * Upload options for file storage
 */
export interface UploadOptions {
  folder?: string;
  publicId?: string;
}

/**
 * File storage provider interface
 * Defines contract for all storage providers (local, cloudinary, etc.)
 */

export interface UploadResult {
  /**
   * Publicly accessible URL of the uploaded file
   */
  url: string;

  /**
   * Provider-specific unique identifier for the file
   * Used for deletion and management
   */
  publicId: string;
}

export interface IFileStorageProvider {
  /**
   * Uploads a file to the storage provider
   * @param file - The multer file object
   * @param options - Optional configuration (folder, transformation, etc.)
   * @returns Promise with upload result containing URL and provider ID
   */
  upload(
    file: Express.Multer.File,
    options?: UploadOptions | UploadApiOptions,
  ): Promise<UploadResult>;

  /**
   * Deletes a file from storage by its provider ID
   * @param publicId - The unique ID returned during upload
   * @returns Promise that resolves when deletion is complete
   */
  delete(
    publicId: string,
    options?: UploadOptions | UploadApiOptions,
  ): Promise<void>;
}

/**
 * Token for dependency injection
 */
export const FILE_STORAGE_PROVIDER = Symbol('FILE_STORAGE_PROVIDER');
