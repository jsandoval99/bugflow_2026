import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IssueStatus, IssuePriority, formatLabel, ChartPayload } from '@bugflow-2026/shared-types';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { IssueEntity } from '../../issues/entities/issue.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { IssueQueryFilters, ResolutionTimeFilters } from '../interfaces/issue-filters.interface';

@Injectable()
export class AiToolsService {
  constructor(
    @InjectRepository(IssueEntity)
    private readonly issuesRepo: Repository<IssueEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentsRepo: Repository<CommentEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectsRepo: Repository<ProjectEntity>,
  ) {}

  private applyFilters(
    qb: SelectQueryBuilder<IssueEntity>,
    filters: IssueQueryFilters,
  ) {
    if (filters.status?.length) {
      qb.andWhere('issue.status IN (:...status)', { status: filters.status });
    }
    if (filters.priority?.length) {
      qb.andWhere('issue.priority IN (:...priority)', { priority: filters.priority });
    }
    if (filters.projectId) {
      qb.andWhere('issue.projectId = :projectId', { projectId: filters.projectId });
    }
    if (filters.unassigned) {
      qb.andWhere('issue.assignee IS NULL');
    }
    if (filters.assigneeDbId) {
      qb.andWhere(`issue.assignee ->> 'dbId' = :assigneeDbId`, {
        assigneeDbId: filters.assigneeDbId,
      });
    }
    if (filters.createdAfter) {
      qb.andWhere('issue.createdAt >= :createdAfter', { createdAfter: filters.createdAfter });
    }
    if (filters.createdBefore) {
      qb.andWhere('issue.createdAt <= :createdBefore', { createdBefore: filters.createdBefore });
    }
    if (filters.updatedAfter) {
      qb.andWhere('issue.updatedAt >= :updatedAfter', { updatedAfter: filters.updatedAfter });
    }
    if (filters.updatedBefore) {
      qb.andWhere('issue.updatedAt <= :updatedBefore', { updatedBefore: filters.updatedBefore });
    }
    if (filters.statusChangedBefore) {
      qb.andWhere('issue.statusChangedAt <= :statusChangedBefore', {
        statusChangedBefore: filters.statusChangedBefore,
      });
    }
    if (filters.statusChangedAfter) {
      qb.andWhere('issue.statusChangedAt >= :statusChangedAfter', {
        statusChangedAfter: filters.statusChangedAfter,
      });
    }
    if (filters.search) {
      qb.andWhere(
        '(issue.title ILIKE :search OR issue.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    return qb;
  }

  private toSummary(issue: IssueEntity) {
    return {
      id: issue.id,
      title: issue.title,
      status: issue.status,
      priority: issue.priority,
      assignee: issue.assignee?.name ?? null,
      projectId: issue.projectId ?? null,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      statusChangedAt: issue.statusChangedAt?.toISOString() ?? null,
    };
  }

  private async resolveLabels(
    groupBy: 'status' | 'priority' | 'projectId',
    grouped: { group: string; count: number }[],
  ): Promise<string[]> {
    if (groupBy !== 'projectId') {
      return grouped.map(g => formatLabel(g.group));
    }

    const projectIds = grouped
      .map(g => g.group)
      .filter((id): id is string => !!id && id !== 'No project');

    if (!projectIds.length) {
      return grouped.map(() => 'No project');
    }

    const projects = await this.projectsRepo.find({
      where: { id: In(projectIds) },
    });
    const namesById = new Map(projects.map(p => [p.id, p.name]));

    return grouped.map(g => namesById.get(g.group) ?? 'No project');
  }

  // ---- Tool: count_issues ----
  async countIssues(filters: IssueQueryFilters) {
    const qb = this.issuesRepo.createQueryBuilder('issue');
    this.applyFilters(qb, filters);
    const count = await qb.getCount();
    return { count };
  }

  // ---- Tool: list_issues ----
  async listIssues(
    filters: IssueQueryFilters & {
      limit?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'statusChangedAt';
      sortOrder?: 'ASC' | 'DESC';
    },
  ) {
    const qb = this.issuesRepo.createQueryBuilder('issue');
    this.applyFilters(qb, filters);
    const limit = Math.min(filters.limit ?? 20, 50);
    qb.orderBy(`issue.${filters.sortBy ?? 'updatedAt'}`, filters.sortOrder ?? 'DESC').take(limit);
    const issues = await qb.getMany();
    return { total: issues.length, issues: issues.map(i => this.toSummary(i)) };
  }

  // ---- Tool: get_stale_issues ----
  async getStaleIssues(hoursWithoutStatusChange: number, filters: IssueQueryFilters = {}) {
    const threshold = new Date(Date.now() - hoursWithoutStatusChange * 3600 * 1000);
    const qb = this.issuesRepo.createQueryBuilder('issue');
    this.applyFilters(qb, { ...filters, statusChangedBefore: threshold.toISOString() });
    qb.orderBy('issue.statusChangedAt', 'ASC').take(50);
    const issues = await qb.getMany();
    return { total: issues.length, issues: issues.map(i => this.toSummary(i)) };
  }

  // ---- Tool: group_issues_by ----
  async groupIssuesBy(field: 'status' | 'priority' | 'projectId', filters: IssueQueryFilters = {}) {
    const qb = this.issuesRepo.createQueryBuilder('issue');
    this.applyFilters(qb, filters);
    qb.select(`issue.${field}`, 'group').addSelect('COUNT(*)', 'count').groupBy(`issue.${field}`);
    const rows = await qb.getRawMany<{ group: string; count: string }>();
    return rows.map(r => ({ group: r.group ?? 'No project', count: Number(r.count) }));
  }

  // ---- Tool: get_user_workload ----
  async getUserWorkload(assigneeDbId: string) {
    const qb = this.issuesRepo
      .createQueryBuilder('issue')
      .where(`issue.assignee ->> 'dbId' = :assigneeDbId`, { assigneeDbId })
      .select('issue.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('issue.status');
    const rows = await qb.getRawMany<{ status: string; count: string }>();
    return rows.map(r => ({ status: r.status, count: Number(r.count) }));
  }

  // ---- Tool: get_comment_activity ----
  async getCommentActivity(dateFrom: string, dateTo: string, issueId?: string) {
    const qb = this.commentsRepo
      .createQueryBuilder('comment')
      .where('comment.createdAt BETWEEN :from AND :to', { from: dateFrom, to: dateTo });
    if (issueId) {
      qb.andWhere('comment.issueId = :issueId', { issueId });
    }
    const count = await qb.getCount();
    return { count, dateFrom, dateTo };
  }

  // ---- Tool: get_average_resolution_time ----
  async getAverageResolutionTime(filters: ResolutionTimeFilters = {}) {
    const qb = this.issuesRepo
      .createQueryBuilder('issue')
      .where('issue.status = :status', { status: IssueStatus.CLOSED });

    if (filters.projectId) {
      qb.andWhere('issue.projectId = :projectId', { projectId: filters.projectId });
    }
    if (filters.priority?.length) {
      qb.andWhere('issue.priority IN (:...priority)', { priority: filters.priority });
    }
    if (filters.closedAfter) {
      qb.andWhere('issue.statusChangedAt >= :closedAfter', { closedAfter: filters.closedAfter });
    }
    if (filters.closedBefore) {
      qb.andWhere('issue.statusChangedAt <= :closedBefore', { closedBefore: filters.closedBefore });
    }

    qb.select('AVG(EXTRACT(EPOCH FROM (issue.statusChangedAt - issue.createdAt)))', 'avgSeconds')
      .addSelect('COUNT(*)', 'count');

    const raw = await qb.getRawOne<{ avgSeconds: string | null; count: string }>();
    const avgSeconds = raw?.avgSeconds ? Number(raw.avgSeconds) : null;

    return {
      issuesConsidered: Number(raw?.count ?? 0),
      averageResolutionHours:
        avgSeconds !== null ? Math.round((avgSeconds / 3600) * 10) / 10 : null,
      note: 'Calculated as statusChangedAt - createdAt on closed issues. statusChangedAt reflects the most recent status change; if an issue was reopened and closed again, only the most recent closure is counted.',
    };
  }

  // ---- Tool: generate_chart_data ----
  async generateChartData(input: {
    chartType: 'bar' | 'pie' | 'line';
    groupBy: 'status' | 'priority' | 'projectId';
    status?: IssueStatus[];
    priority?: IssuePriority[];
    projectId?: string;
  }): Promise<ChartPayload> {
    const grouped = await this.groupIssuesBy(input.groupBy, {
      status: input.status,
      priority: input.priority,
      projectId: input.projectId,
    });

    const labels = await this.resolveLabels(input.groupBy, grouped);

    return {
      chartType: input.chartType,
      title: `Issues by ${formatLabel(input.groupBy === 'projectId' ? 'project' : input.groupBy)}`,
      labels,
      datasets: [{ label: 'Issues', data: grouped.map(g => g.count) }],
    };
  }

}
