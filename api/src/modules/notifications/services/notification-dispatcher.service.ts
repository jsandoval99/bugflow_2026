import { Injectable } from '@nestjs/common';
import { NotificationType } from '@bugflow-2026/shared-types';
import { NotificationsService } from '../notifications.service';
import { RealtimeService } from '../../realtime/services/realtime.service';
import { IssueWatchersService } from '../../issues/issue-watchers.service';
import { toNotification } from '../entities/notifications.mapper';
import { IssueEntity } from '../../issues/entities/issue.entity';

@Injectable()
export class NotificationDispatcherService {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
    private readonly issueWatchersService: IssueWatchersService,
  ) {}

  private async createAndEmit(
    userId: string,
    issueId: string,
    type: NotificationType,
    message: string,
  ) {
    const notification =
      await this.notificationsService.create({
        userId,
        issueId,
        type,
        message,
      });

    this.realtimeService.notificationCreated(
      userId,
      toNotification(notification),
    );
  }

  async notifyAssignee(issue: IssueEntity, prevAssigneeId?: string) {
    const hasNewAssignee = !!issue.assignee?.dbId;

    if (!issue.assignee?.dbId) {
      return;
    }
    if (prevAssigneeId && prevAssigneeId !== issue.assignee?.dbId) {
      await this.createAndEmit(
        prevAssigneeId,
        issue.id,
        NotificationType.ISSUE_ASSIGNED,
        `You were unassigned from issue "${issue.title}"`,
      );
    }
    if (hasNewAssignee) {
      await this.createAndEmit(
        issue.assignee.dbId,
        issue.id,
        NotificationType.ISSUE_ASSIGNED,
        `You were assigned to issue "${issue.title}"`,
      );
    }
  }

  async notifyWatchers(
    issue: IssueEntity,
    type: NotificationType,
    message: string,
    excludeUserIds: string[] = [],
  ) {
    const watchers = await this.issueWatchersService.getWatchers(issue.id);
    const watcherIds = watchers.map(w => w.userId);
    const assignerId = issue.assignee?.dbId;

    if (assignerId && !watcherIds.includes(assignerId)) {
      watcherIds.push(assignerId);
    }

    for (const watcherId of watcherIds) {
      if (excludeUserIds.includes(watcherId)) {
        continue;
      }
      await this.createAndEmit(
        watcherId,
        issue.id,
        type,
        message,
      );
    }
  }

  async notifyReporter(
    issue: IssueEntity,
    type: NotificationType,
    message: string,
    excludeUserIds: string[] = [],
  ) {
    console.log(issue, type, message, excludeUserIds, 'notifyReporter');
    // if (!issue.reporter?.id) {
    //   return;
    // }

    // if (excludeUserIds.includes(issue.reporter.id)) {
    //   return;
    // }

    // await this.createAndEmit(
    //   issue.reporter.id,
    //   issue.id,
    //   type,
    //   message,
    // );
  }

  async notifyIssueUpdated(
    issue: IssueEntity,
    actorUserIds: string[],
  ) {
    const message =
      `Issue "${issue.title}" was updated`;

    await Promise.all([
      this.notifyReporter(
        issue,
        NotificationType.ISSUE_UPDATED,
        message,
        actorUserIds,
      ),

      this.notifyWatchers(
        issue,
        NotificationType.ISSUE_UPDATED,
        message,
        actorUserIds,
      ),
    ]);
  }

  async notifyCommentAdded(
    issue: IssueEntity,
    actorUserIds: string[],
    userName: string,
  ) {
    const message = `${userName} added a comment to issue "${issue.title}"`;

    await Promise.all([
      this.notifyReporter(
        issue,
        NotificationType.COMMENT_ADDED,
        message,
        actorUserIds,
      ),
      this.notifyWatchers(
        issue,
        NotificationType.COMMENT_ADDED,
        message,
        actorUserIds,
      ),
    ]);
  }

}
