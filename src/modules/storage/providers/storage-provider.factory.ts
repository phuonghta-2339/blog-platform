import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '@/common/constants/config-keys';
import {
  FILE_STORAGE_PROVIDER,
  IFileStorageProvider,
} from '../interfaces/file-storage-provider.interface';
import { MulterStorageProvider } from './multer.provider';
import { CloudinaryProvider } from './cloudinary.provider';
import {
  StorageProviderType,
  DEFAULT_STORAGE_PROVIDER,
} from '@/common/constants/providers';

/**
 * Storage Provider Factory
 * Dynamically selects the storage provider based on configuration
 * Follows Dependency Inversion Principle (DIP) and Factory Pattern
 */
export const storageProviderFactory: Provider<IFileStorageProvider> = {
  provide: FILE_STORAGE_PROVIDER,
  useFactory: (configService: ConfigService): IFileStorageProvider => {
    const providerType =
      (configService.get<StorageProviderType>(
        ConfigKeys.STORAGE.PROVIDER as string,
      ) as StorageProviderType) || DEFAULT_STORAGE_PROVIDER;

    switch (providerType) {
      case StorageProviderType.MULTER:
        return new MulterStorageProvider(configService);
      case StorageProviderType.CLOUDINARY:
        return new CloudinaryProvider(configService);
      default:
        // Fallback to default provider
        return new MulterStorageProvider(configService);
    }
  },
  inject: [ConfigService],
};
