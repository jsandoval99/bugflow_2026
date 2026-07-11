import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IssueWatcherEntity } from './entities/issue-watcher.entity';

@Injectable()
export class IssueWatchersService {
  constructor(
    @InjectRepository(IssueWatcherEntity)
    private readonly repo: Repository<IssueWatcherEntity>,
  ) {}

  async watch(issueId: string, userId: string) {
    const existing = await this.repo.findOne({
      where: { issueId, userId },
    });

    if (existing) {
      return existing;
    }

    return this.repo.save(
      this.repo.create({ issueId, userId }),
    );
  }

  async isWatching(issueId: string, userId: string) {
    const existing = await this.repo.findOne({
      where: { issueId, userId },
    });
    return !!existing;
  }

  async unwatch(issueId: string, userId: string) {
    await this.repo.delete({ issueId, userId });
  }

  async getWatchers(issueId: string) {
    return this.repo.find({
      where: { issueId },
      relations: { user: true },
    });
  }
}
