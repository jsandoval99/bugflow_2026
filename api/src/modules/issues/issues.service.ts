import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardStats, Issue, IssueStatus, PaginatedResponse , NotificationType, User } from '@bugflow-2026/shared-types';
import { IssueEntity } from './entities/issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ProjectEntity } from '../projects/entities/project.entity';
import { FindIssuesDto } from './dto/find-issues.dto';
import { RealtimeService } from '../realtime/services/realtime.service';
import { NotificationDispatcherService } from '../notifications/services/notification-dispatcher.service';
import { IssueWatchersService } from './issue-watchers.service';
import { toIssue } from './entities/issues.mapper';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(IssueEntity)
    private repo: Repository<IssueEntity>,
    private realtimeService: RealtimeService,
    @InjectRepository(ProjectEntity)
    private projectsRepo: Repository<ProjectEntity>,
    private readonly notificationDispatcherService: NotificationDispatcherService,
    private readonly issueWatchersService: IssueWatchersService,
  ) {}

  async create(createIssueDto: CreateIssueDto) {
    if (createIssueDto.projectId) {
      const project = await this.projectsRepo.findOneBy({
        id: createIssueDto.projectId,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const issue = this.repo.create(createIssueDto);
    const savedIssue = await this.repo.save(issue);
    this.realtimeService.issueCreated(toIssue(savedIssue));

    if (savedIssue.assignee?.id) {
      await this.issueWatchersService.watch(savedIssue.id, savedIssue.assignee.dbId);
      await this.notificationDispatcherService.notifyAssignee(savedIssue);
    }

    return savedIssue;
  }

  async findAll(query: FindIssuesDto): Promise<PaginatedResponse<Issue>> {
    const { status, priority, search, projectId, page, pageSize } = query;
    const qb = this.repo
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.project', 'project');

    if (status) {
      qb.andWhere('issue.status = :status', { status });
    }
    if (priority) {
      qb.andWhere('issue.priority = :priority', { priority });
    }
    if (search) {
      qb.andWhere(
        `(
          issue.title ILIKE :search
          OR issue.description ILIKE :search
          OR COALESCE(issue.assignee->>'name', '') ILIKE :search
        )`,
        { search: `%${search}%` }
      );
    }
    if (projectId === 'none') {
      qb.andWhere('issue.projectId IS NULL');
    } else if (projectId) {
      qb.andWhere(
        'issue.projectId = :projectId',
        { projectId }
      );
    }

    qb.orderBy('issue.createdAt', 'DESC')
      .addOrderBy('issue.updatedAt', 'DESC');

    const skip = (page - 1) * pageSize;
    qb.skip(skip);
    qb.take(pageSize);

    const [issues, total] = await qb.getManyAndCount();

    const mappedIssues = issues.map(issue => ({
      ...issue,
      assignee: issue.assignee,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
    }));

    return {
      data: mappedIssues,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<Issue> {
    const issue = await this.repo.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    return toIssue(issue);
  }

  async update(id: string, updateIssueDto: UpdateIssueDto, user: User) {
    const existingIssue = await this.repo.findOne({
      where: { id }, relations: { project: true },
    });
    if (!existingIssue) throw new NotFoundException('Issue not found');

    await this.repo.update(id, updateIssueDto);
    const updatedIssue = await this.repo.findOne({
      where: { id }, relations: { project: true },
    });
    if (!updatedIssue) throw new NotFoundException('Issue not found');
    if (updateIssueDto.status !== undefined && existingIssue.status !== updateIssueDto.status) {
      await this.repo.update(id, { statusChangedAt: new Date() });
    }

    const previousAssigneeDbId = existingIssue.assignee?.dbId;
    const newAssigneeDbId = updatedIssue.assignee?.dbId;
    const assigneeChanged = existingIssue.assignee?.id !== updatedIssue.assignee?.id;
    const actorUserIds = [user.id];

    if (assigneeChanged) {
      if (previousAssigneeDbId) actorUserIds.push(previousAssigneeDbId);
      if (newAssigneeDbId) {
        actorUserIds.push(newAssigneeDbId);
        await this.issueWatchersService.watch(updatedIssue.id, newAssigneeDbId);
      }
      await this.notificationDispatcherService.notifyAssignee(updatedIssue, previousAssigneeDbId);
    }
    if (
      (updateIssueDto.title !== undefined && existingIssue.title !== updateIssueDto.title) ||
      (updateIssueDto.description !== undefined && existingIssue.description !== updateIssueDto.description) ||
      (updateIssueDto.projectId !== undefined && existingIssue.projectId !== updateIssueDto.projectId) ||
      (updateIssueDto.status !== undefined && existingIssue.status !== updateIssueDto.status) ||
      (updateIssueDto.priority !== undefined && existingIssue.priority !== updateIssueDto.priority)
    ) {
      await this.notificationDispatcherService.notifyIssueUpdated(
        updatedIssue,
        actorUserIds,
      );
    }

    this.realtimeService.issueUpdated(toIssue(updatedIssue));

    return updatedIssue;
  }

  async remove(id: string) {
    const deletedIssue = await this.repo.findOne({
      where: { id }, relations: { project: true },
    });

    await this.repo.delete(id);

    if (!deletedIssue) {
      throw new NotFoundException('Issue not found');
    }

    await this.notificationDispatcherService.notifyWatchers(
      deletedIssue,
      NotificationType.ISSUE_DELETED,
      `Issue "${deletedIssue.title}" was deleted`
    );

    this.realtimeService.issueDeleted(toIssue(deletedIssue));

    return { deleted: true };
  }

  async getStats(): Promise<DashboardStats> {
    const [
      total,
      open,
      inProgress,
      inTest,
      closed,
    ] = await Promise.all([
      this.repo.count(),
      this.repo.count({
        where: { status: IssueStatus.OPEN },
      }),
      this.repo.count({
        where: { status: IssueStatus.IN_PROGRESS },
      }),
      this.repo.count({
        where: { status: IssueStatus.IN_TEST },
      }),
      this.repo.count({
        where: { status: IssueStatus.CLOSED },
      }),
    ]);

    const recentIssues = await this.repo.find({
      order: { createdAt: 'DESC' }, take: 5,
    });

    return {
      total,
      open,
      inProgress,
      inTest,
      closed,
      recentIssues: recentIssues.map(toIssue),
    };
  }
}
