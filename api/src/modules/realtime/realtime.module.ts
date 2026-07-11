import { Module } from '@nestjs/common';
import { IssuesGateway } from './gateways/issues.gateway';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { RealtimeService } from './services/realtime.service';

@Module({
  providers: [IssuesGateway, NotificationsGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
