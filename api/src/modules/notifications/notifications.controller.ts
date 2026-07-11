import { Controller, Get, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@bugflow-2026/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    const userdb: User = req.user.dbUser;
    return this.notificationsService.findAll(userdb.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userdb: User = req.user.dbUser;
    return this.notificationsService.findOne(id, userdb.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    const userdb: User = req.user.dbUser;
    return this.notificationsService.markAsRead(id, userdb.id);
  }

  @Patch('read-all')
  markAll(@Req() req: any) {
    const userdb: User = req.user.dbUser;
    return this.notificationsService.markAllAsRead(userdb.id);
  }

  @Delete()
  clear(@Req() req: any) {
    const userdb: User = req.user.dbUser;
    return this.notificationsService.removeAll(userdb.id);
  }
}
