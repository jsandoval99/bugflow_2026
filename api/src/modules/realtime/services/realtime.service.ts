import { Injectable } from '@nestjs/common';
import { IssuesGateway } from '../gateways/issues.gateway';
import { Issue } from '@bugflow-2026/shared-types';

@Injectable()
export class RealtimeService {
  constructor(
    private readonly issuesGateway: IssuesGateway,
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
}
