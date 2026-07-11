export enum NotificationType {
  COMMENT_ADDED = 'comment_added',
  COMMENT_EDITED = 'comment_edited',
  COMMENT_DELETED = 'comment_deleted',
  ISSUE_UPDATED = 'issue_updated',
  ISSUE_ASSIGNED = 'issue_assigned',
  ISSUE_CREATED = 'issue_created',
  ISSUE_DELETED = 'issue_deleted',
}

export interface BugFlowNotification {
  id: string;
  userId: string;
  issueId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}
