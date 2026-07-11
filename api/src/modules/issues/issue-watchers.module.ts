import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IssueWatcherEntity } from './entities/issue-watcher.entity';
import { IssueWatchersService } from './issue-watchers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IssueWatcherEntity]),
  ],
  providers: [IssueWatchersService],
  exports: [IssueWatchersService],
})
export class IssueWatchersModule {}
