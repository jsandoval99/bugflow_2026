import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { toNotification } from './entities/notifications.mapper';
import { BugFlowNotification } from '@bugflow-2026/shared-types';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = this.repo.create({
      ...dto,
      read: false,
    });

    return await this.repo.save(notification);
  }

  async findAll(userId: string): Promise<BugFlowNotification[]> {
    const notifications = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return notifications.map(toNotification);
  }

  async findOne(id: string, userId: string) {
    const notification = await this.repo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.findOne(id, userId);

    notification.read = true;

    return this.repo.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.repo.update(
      { userId, read: false },
      { read: true },
    );

    return { success: true };
  }

  async removeAll(userId: string) {
    await this.repo.delete({ userId });

    return { success: true };
  }
}
