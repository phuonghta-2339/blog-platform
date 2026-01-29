import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailModule } from '../mail/mail.module';
import { NotificationListener } from './listeners/notification.listener';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards for event names
      wildcard: false,
      // Set the delimiter used to segment namespaces
      delimiter: '.',
      // Set this to `true` to use newListener event
      newListener: false,
      // Set this to `true` to use removeListener event
      removeListener: false,
      // Maximum number of listeners that can be assigned to an event
      maxListeners: 100,
      // Show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // Disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    MailModule,
  ],
  providers: [NotificationListener],
  exports: [EventEmitterModule],
})
export class NotificationsModule {}
