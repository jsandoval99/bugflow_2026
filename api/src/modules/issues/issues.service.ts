import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardStats, Issue, IssueStatus, PaginatedResponse } from '@bugflow-2026/shared-types';
import { IssueEntity } from './entities/issue.entity';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ProjectEntity } from '../projects/entities/project.entity';
import { FindIssuesDto } from './dto/find-issues.dto';
import { RealtimeService } from '../realtime/services/realtime.service';
import { toIssue } from './entities/issues.mapper';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(IssueEntity)
    private repo: Repository<IssueEntity>,
    private realtimeService: RealtimeService,
    @InjectRepository(ProjectEntity)
    private projectsRepo: Repository<ProjectEntity>,
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

  async findOne(id: string) {
    return this.repo.findOneBy({ id });
  }

  async update(id: string, updateIssueDto: UpdateIssueDto) {
    await this.repo.update(id, updateIssueDto);
    const updatedIssue = await this.repo.findOne({
      where: { id }, relations: { project: true },
    });

    if (!updatedIssue) {
      throw new NotFoundException('Issue not found');
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
