import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
  UploadApiErrorResponse,
  DeleteApiResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import { ConfigKeys } from '@/common/constants/config-keys';
import {
  IFileStorageProvider,
  UploadResult,
} from '../interfaces/file-storage-provider.interface';
import { CLOUDINARY_CONSTANTS } from '../constants/storage-provider.constants';
import { STORAGE_REGEX } from '../constants/storage.constants';

/**
 * Cloudinary Storage Provider
 * Streams files directly to Cloudinary cloud storage
 * Best for: Production, scalability, CDN delivery, image transformations
 */
@Injectable()
export class CloudinaryProvider implements IFileStorageProvider {
  private readonly logger = new Logger(CloudinaryProvider.name);
  private readonly cloudName: string | undefined;
  private readonly apiKey: string | undefined;
  private readonly apiSecret: string | undefined;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>(
      ConfigKeys.CLOUDINARY.CLOUD_NAME as string,
    );
    this.apiKey = this.configService.get<string>(
      ConfigKeys.CLOUDINARY.API_KEY as string,
    );
    this.apiSecret = this.configService.get<string>(
      ConfigKeys.CLOUDINARY.API_SECRET as string,
    );

    this.initializeClient();
  }

  /**
   * Initialize Cloudinary client with configuration
   */
  private initializeClient(): void {
    if (this.cloudName && this.apiKey && this.apiSecret) {
      try {
        cloudinary.config({
          cloud_name: this.cloudName,
          api_key: this.apiKey,
          api_secret: this.apiSecret,
        });

        this.isInitialized = true;
        this.logger.log(
          `Cloudinary client initialized for cloud: ${this.cloudName}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : (JSON.stringify(error) ?? String(error));
        this.logger.error(
          `Failed to configure Cloudinary client: ${errorMessage}`,
        );
      }
    } else {
      this.logger.warn(
        'Cloudinary credentials not completely configured - provider will not be available',
      );
    }
  }

  /**
   * Build Cloudinary folder path
   * @param folder - Folder name
   * @returns Full folder path with prefix
   */
  private buildFolderPath(folder: string): string {
    const cleanFolder = folder.replace(STORAGE_REGEX.REMOVE_SLASHES, '');
    return `${CLOUDINARY_CONSTANTS.FOLDER_PREFIX}/${cleanFolder}`;
  }

  /**
   * Uploads a file to Cloudinary using stream
   * @param file - The multer file object
   * @param options - Optional folder and transformation options
   * @returns Upload result with Cloudinary URL and public_id
   */
  async upload(
    file: Express.Multer.File,
    options?: UploadApiOptions,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const folderPath = this.buildFolderPath(options?.folder || 'uploads');
      const uploadOptions: UploadApiOptions = {
        folder: folderPath,
        resource_type: 'auto',
        ...options,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error(
              `Failed to upload file to Cloudinary: ${error.message}`,
              error,
            );
            return reject(new Error('Failed to upload file to Cloudinary'));
          }

          if (!result) {
            this.logger.error('Cloudinary upload returned no result');
            return reject(
              new Error('Failed to upload file to Cloudinary: No result'),
            );
          }

          this.logger.debug(
            `File uploaded successfully to Cloudinary: ${result.secure_url}`,
          );

          // Return full secure_url and public_id from Cloudinary
          // public_id format: 'folder/subfolder/filename' (without extension)
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      // Convert buffer to readable stream and pipe to Cloudinary
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Deletes a file from Cloudinary
   * @param publicId - The Cloudinary public_id or filename
   * @param options - Deletion options containing folder context
   */
  async delete(publicId: string, options?: UploadApiOptions): Promise<void> {
    try {
      // Cloudinary expects public_id without extension
      let safePublicId = publicId.replace(STORAGE_REGEX.STRIP_EXTENSION, '');

      // If just a filename is provided (no path separators) and folder option exists
      // We assume we need to reconstruct the full public_id including prefix and folder
      if (
        !safePublicId.includes('/') &&
        !safePublicId.includes('\\') &&
        options?.folder
      ) {
        const cleanFolder = options.folder.replace(
          STORAGE_REGEX.REMOVE_SLASHES,
          '',
        );
        // Reconstruct: prefix/folder/filename
        safePublicId = `${CLOUDINARY_CONSTANTS.FOLDER_PREFIX}/${cleanFolder}/${safePublicId}`;

        this.logger.debug(
          `Reconstructed Cloudinary Public ID from filename: ${safePublicId}`,
        );
      }

      const result = (await cloudinary.uploader.destroy(
        safePublicId,
      )) as DeleteApiResponse;

      if (result.http_code === 200) {
        this.logger.log(
          `File deleted successfully from Cloudinary: ${safePublicId}`,
        );
      } else if (result.http_code === 404) {
        this.logger.warn(
          `File not found for deletion in Cloudinary: ${safePublicId}. It may have been already deleted.`,
        );
      } else {
        this.logger.warn(
          `Unexpected result when deleting from Cloudinary: ${result.message} (HTTP ${result.http_code})`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to delete file from Cloudinary: ${errorMessage}`,
        errorStack,
      );
      throw new Error('Failed to delete file from Cloudinary');
    }
  }
}
