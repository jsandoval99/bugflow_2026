import { IssueStatus } from './issue-status.enum';
import { IssuePriority } from './issue-priority.enum';
import { Project } from './project.interface';

export interface IssueAssignee {
  id: string;
  name: string;
  dbId: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: IssueAssignee | null;
  project?: Pick<Project, 'id' | 'name'> | null;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateIssuePayload = {
  title: string;
  description: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignee?: IssueAssignee | null;
  projectId?: string | null;
};
export type UpdateIssuePayload = Partial<CreateIssuePayload>;

export interface PaginationFilters {
  page: number;
  pageSize: number;
}

export interface IssueFilters extends PaginationFilters {
  status: "" | IssueStatus;
  priority: IssuePriority | "";
  search: string;
  projectId: string;
}
