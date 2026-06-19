import { Issue } from "./issue.interface";

export interface DashboardStats {
  total: number;
  open: number;
  inProgress: number;
  inTest: number;
  closed: number;
  recentIssues: Issue[];
}
