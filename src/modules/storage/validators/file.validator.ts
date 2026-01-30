import {
  FileTypeValidator,
  MaxFileSizeValidator,
  FileValidator,
} from '@nestjs/common';

/**
 * Custom file validator for images
 * Combines file type and size validation with clear error messages
 */
export class ImageFileValidator extends FileValidator {
  private readonly allowedMimeTypes: string[];
  private readonly maxSizeBytes: number;

  constructor(options: { allowedMimeTypes: string[]; maxSizeBytes: number }) {
    super({});
    this.allowedMimeTypes = options.allowedMimeTypes;
    this.maxSizeBytes = options.maxSizeBytes;
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) {
      return false;
    }

    // Check file is not empty
    if (file.size === 0) {
      return false;
    }

    // Check file type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return false;
    }

    // Check file size
    if (file.size > this.maxSizeBytes) {
      return false;
    }

    return true;
  }

  buildErrorMessage(): string {
    const allowedTypes = this.allowedMimeTypes.join(', ');
    const maxSizeMB = (this.maxSizeBytes / (1024 * 1024)).toFixed(2);
    return `File must not be empty, must be one of: ${allowedTypes}, and not exceed ${maxSizeMB}MB`;
  }
}

/**
 * Factory function to create a FileTypeValidator
 */
export function createFileTypeValidator(allowedMimeTypes: string[]) {
  return new FileTypeValidator({
    fileType: new RegExp(allowedMimeTypes.join('|')),
  });
}

/**
 * Factory function to create a MaxFileSizeValidator
 */
export function createMaxFileSizeValidator(maxSizeBytes: number) {
  return new MaxFileSizeValidator({ maxSize: maxSizeBytes });
}
