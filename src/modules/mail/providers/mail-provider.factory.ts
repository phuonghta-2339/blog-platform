import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '@/common/constants/config-keys';
import { MAIL_PROVIDER } from '../interfaces/mail-provider.interface';
import { MailgunProvider } from './mailgun.provider';
import { SendGridProvider } from './sendgrid.provider';
import {
  MailProviderType,
  DEFAULT_MAIL_PROVIDER,
} from '../constants/mail-provider.constants';

/**
 * Mail Provider Factory
 * Dynamically selects the mail provider based on configuration
 * Follows Dependency Inversion Principle (DIP) and Factory Pattern
 */
export const mailProviderFactory: Provider = {
  provide: MAIL_PROVIDER,
  useFactory: (configService: ConfigService) => {
    const providerType =
      (configService.get<string>(
        ConfigKeys.MAIL.PROVIDER,
      ) as MailProviderType) || DEFAULT_MAIL_PROVIDER;

    switch (providerType) {
      case MailProviderType.MAILGUN:
        return new MailgunProvider(configService);
      case MailProviderType.SENDGRID:
        return new SendGridProvider(configService);
      default:
        // Fallback to default provider
        return new MailgunProvider(configService);
    }
  },
  inject: [ConfigService],
};
