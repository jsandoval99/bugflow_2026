import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from '../modules/users/users.module';
import { ProjectsModule } from '../modules/projects/projects.module';
import { IssuesModule } from '../modules/issues/issues.module';
import { CommentsModule } from '../modules/comments/comments.module';
import { AuthModule } from '../modules/auth/auth.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { DatabaseModule } from '../modules/database/database.module';
import { CommonModule } from '../common/common.module';
import { JobsModule } from '../modules/jobs/jobs.module';
import { RealtimeModule } from '../modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    UsersModule,
    ProjectsModule,
    IssuesModule,
    CommentsModule,
    AuthModule,
    NotificationsModule,
    DatabaseModule,
    CommonModule,
    JobsModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
