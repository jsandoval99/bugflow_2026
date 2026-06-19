import { Module } from '@nestjs/common';
import { IssuesGateway } from './gateways/issues.gateway';
import { RealtimeService } from './services/realtime.service';

@Module({
  providers: [IssuesGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
