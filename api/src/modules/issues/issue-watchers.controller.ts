import { Controller, Post, Param, Delete, UseGuards, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IssueWatchersService } from './issue-watchers.service';
import { User } from '@bugflow-2026/shared-types';

@ApiTags('Issue-Watchers')
@ApiBearerAuth()
@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssueWatchersController {
  constructor(
    private readonly issueWatchersService: IssueWatchersService
  ) {}

  @Get(':id/watch')
  isWatching(@Param('id') issueId: string, @Req() req: any) {
    const userdb: User = req.user.dbUser;
    return this.issueWatchersService.isWatching(issueId, userdb.id);
  }

  @Get(':id/watchers')
  watchers(@Param('id') issueId: string ) {
    return this.issueWatchersService.getWatchers(issueId)
  }

  @Post(':id/watch')
  watch(@Param('id') issueId: string, @Req() req: any) {
    const userdb: User = req.user.dbUser;
    return this.issueWatchersService.watch(issueId, userdb.id);
  }

  @Delete(':id/watch')
  unwatch(@Param('id') issueId: string, @Req() req: any) {
    const userdb: User = req.user.dbUser;
    return this.issueWatchersService.unwatch(issueId, userdb.id);
  }

}
