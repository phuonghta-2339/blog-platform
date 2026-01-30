import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { storageProviderFactory } from './providers/storage-provider.factory';

/**
 * Storage Module
 * Provides file upload functionality with pluggable storage providers
 * Supports local filesystem and Cloudinary
 */
@Module({
  imports: [ConfigModule],
  providers: [storageProviderFactory],
  exports: [storageProviderFactory],
})
export class StorageModule {}
