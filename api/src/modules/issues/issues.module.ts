import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { IssueEntity } from './entities/issue.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { IssueWatchersController } from './issue-watchers.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { IssueWatchersModule } from './issue-watchers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IssueEntity,
      ProjectEntity,
    ]),
    AuthModule,
    RealtimeModule,
    NotificationsModule,
    IssueWatchersModule,
  ],
  controllers: [IssuesController, IssueWatchersController],
  providers: [IssuesService],
})
export class IssuesModule {}
