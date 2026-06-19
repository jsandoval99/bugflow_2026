import { Issue } from "@bugflow-2026/shared-types";
import { IssueEntity } from "./issue.entity";

export function toIssue(
  entity: IssueEntity,
): Issue {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    status: entity.status,
    priority: entity.priority,
    projectId: entity.project?.id ?? null,
    assignee: entity.assignee ?? null,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
