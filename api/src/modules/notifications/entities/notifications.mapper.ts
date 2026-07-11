import { BugFlowNotification } from '@bugflow-2026/shared-types';
import { NotificationEntity } from './notification.entity';

export function toNotification(
  entity: NotificationEntity,
): BugFlowNotification {
  return {
    id: entity.id,
    userId: entity.userId,
    issueId: entity.issueId,
    type: entity.type,
    message: entity.message,
    read: entity.read,
    createdAt: entity.createdAt.toISOString(),
  };
}
