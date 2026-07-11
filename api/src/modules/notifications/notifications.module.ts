import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationDispatcherService } from './services/notification-dispatcher.service';
import { NotificationsController } from './notifications.controller';
import { NotificationEntity } from './entities/notification.entity';
import { IssueWatchersModule } from '../issues/issue-watchers.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ NotificationEntity ]),
    RealtimeModule,
    IssueWatchersModule,
  ],
  controllers: [ NotificationsController ],
  providers: [ NotificationsService, NotificationDispatcherService ],
  exports: [ NotificationsService, NotificationDispatcherService ],
})
export class NotificationsModule {}
