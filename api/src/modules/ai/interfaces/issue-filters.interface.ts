import { IssueStatus, IssuePriority } from '@bugflow-2026/shared-types';

export interface IssueQueryFilters {
  status?: IssueStatus[];
  priority?: IssuePriority[];
  projectId?: string;
  unassigned?: boolean;
  assigneeDbId?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;
  statusChangedBefore?: string;
  statusChangedAfter?: string;
  search?: string;
}

export interface ResolutionTimeFilters {
  projectId?: string;
  priority?: IssuePriority[];
  closedAfter?: string;
  closedBefore?: string;
}
