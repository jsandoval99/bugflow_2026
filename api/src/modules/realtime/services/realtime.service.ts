import { Injectable } from '@nestjs/common';
import { Issue, BugFlowNotification } from '@bugflow-2026/shared-types';
import { IssuesGateway } from '../gateways/issues.gateway';
import { NotificationsGateway } from '../gateways/notifications.gateway';

@Injectable()
export class RealtimeService {
  constructor(
    private readonly issuesGateway: IssuesGateway,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  issueCreated(issue: Issue) {
    this.issuesGateway.emitIssueCreated(issue);
  }

  issueUpdated(issue: Issue) {
    this.issuesGateway.emitIssueUpdated(issue);
  }

  issueDeleted(issue: Issue) {
    this.issuesGateway.emitIssueDeleted(issue);
  }

  commentCreated(issueId: string) {
    this.issuesGateway.emitCommentCreated(issueId);
  }

  commentUpdated(issueId: string) {
    this.issuesGateway.emitCommentUpdated(issueId);
  }

  commentDeleted(issueId: string) {
    this.issuesGateway.emitCommentDeleted(issueId);
  }

  notificationCreated(userId: string, notification: BugFlowNotification) {
    this.notificationsGateway.emitNotificationCreated(userId, notification);
  }

}
