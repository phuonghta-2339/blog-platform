import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import path, { join } from 'path';
import { ConfigKeys } from '@/common/constants/config-keys';
import {
  IFileStorageProvider,
  UploadOptions,
  UploadResult,
} from '../interfaces/file-storage-provider.interface';
import {
  LOCAL_STORAGE_CONFIG,
  STORAGE_REGEX,
} from '../constants/storage.constants';

/**
 * Multer Storage Provider
 * Stores files in the local filesystem using Multer
 */
@Injectable()
export class MulterStorageProvider
  implements IFileStorageProvider, OnModuleInit
{
  private readonly logger = new Logger(MulterStorageProvider.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>(
        ConfigKeys.STORAGE.LOCAL_UPLOAD_DIR as string,
      ) || LOCAL_STORAGE_CONFIG.UPLOAD_DIR;

    const appUrl = this.configService.get<string>(ConfigKeys.APP.URL as string);
    const urlPrefix =
      this.configService.get<string>(
        ConfigKeys.STORAGE.LOCAL_URL_PREFIX as string,
      ) || LOCAL_STORAGE_CONFIG.URL_PREFIX;

    // Validate required configuration
    if (!appUrl) {
      throw new Error(
        'APP_URL is required for local storage provider. Please set APP_URL in your environment variables.',
      );
    }

    // Construct base URL properly
    const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    const cleanUrlPrefix = urlPrefix.startsWith('/')
      ? urlPrefix
      : `/${urlPrefix}`;

    this.baseUrl = `${cleanAppUrl}${cleanUrlPrefix}`;

    this.logger.log(
      `Multer storage provider initialized with base URL: ${this.baseUrl}`,
    );
  }

  /**
   * Lifecycle hook to ensure resources are ready
   */
  async onModuleInit(): Promise<void> {
    await this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
      this.logger.debug(`Upload directory exists: ${this.uploadDir}`);
    } catch {
      try {
        await fs.mkdir(this.uploadDir, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadDir}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : (JSON.stringify(error) ?? String(error));
        this.logger.error(`Failed to create upload directory: ${errorMessage}`);
        // We don't throw here to avoid crashing the app on startup,
        // but uploads will fail if this didn't work.
      }
    }
  }

  /**
   * Generate unique filename
   * @param file - Express Multer file object
   * @param folder - Folder name
   * @returns Unique filename
   */
  private generateUniqueFilename(file: Express.Multer.File): string {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(
      STORAGE_REGEX.SANITIZE_FILENAME,
      '_',
    );

    return `${timestamp}_${sanitizedOriginalName}`;
  }

  /**
   * Uploads a file to local filesystem
   * @param file - The multer file object
   * @param options - Optional folder configuration
   * @returns Upload result with local URL and file path
   */
  async upload(
    file: Express.Multer.File,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    try {
      const filename = this.generateUniqueFilename(file);

      // Determine folder path
      const folderPath = options?.folder
        ? join(this.uploadDir, options.folder)
        : this.uploadDir;

      // Ensure directory exists
      await fs.mkdir(folderPath, { recursive: true });

      // Full file path
      const filePath = join(folderPath, filename);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Generate public URL
      const relativePath = options?.folder
        ? `${options.folder}/${filename}`
        : filename;

      // Ensure no double slashes in URL
      const cleanRelativePath = relativePath.startsWith('/')
        ? relativePath.slice(1)
        : relativePath;
      const url = `${this.baseUrl}/${cleanRelativePath}`;

      this.logger.debug(`File uploaded successfully to local storage: ${url}`);

      return { url, publicId: filename };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to upload file to local storage: ${errorMessage}`,
        errorStack,
      );
      throw new Error('Failed to upload file to local storage');
    }
  }

  /**
   * Deletes a file from local filesystem
   * @param publicId - The file path or filename
   * @param options - Deletion options containing folder context
   */
  async delete(publicId: string, options?: UploadOptions): Promise<void> {
    try {
      // Ensure we have a valid string
      if (!publicId || typeof publicId !== 'string') {
        this.logger.warn(`Invalid file identifier provided for deletion`);
        return;
      }

      let relativePath = publicId;

      // If just a filename is provided and folder option exists, construct path
      if (!relativePath.includes('/') && !relativePath.includes('\\')) {
        if (options?.folder) {
          relativePath = join(options.folder, relativePath);
        } else {
          // If no folder context, we can't reliably locate just a filename in nested structure
          // But we will proceed trying to normalize it, assuming root or already relative
          this.logger.debug(
            `Deleting file '${relativePath}' without folder context. Assumed relative to upload root.`,
          );
        }
      }

      // Prevent path traversal and normalize
      const safeRelativePath = path
        .normalize(relativePath)
        .replace(STORAGE_REGEX.PATH_TRAVERSAL, '');

      // Remove leading slash if present to ensure join works correctly from root
      const cleanPath = safeRelativePath.replace(
        STORAGE_REGEX.REMOVE_SLASHES,
        '',
      );

      // Resolve full path from upload directory
      const fullPath = join(this.uploadDir, cleanPath);

      this.logger.debug(`Attempting to delete file: ${fullPath}`);

      await fs.unlink(fullPath);
      this.logger.log(
        `File deleted successfully from local storage: ${cleanPath}`,
      );
    } catch (error) {
      // If file doesn't exist, log warning but don't throw
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        this.logger.warn(
          `File not found for deletion: ${publicId}. It may have been already deleted.`,
        );
        return;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to delete file from local storage: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error('Failed to delete file from local storage');
    }
  }
}
