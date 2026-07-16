import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssueEntity } from './entities/issue.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { RealtimeService } from '../realtime/services/realtime.service';
import { IssueWatchersService } from './issue-watchers.service';
import { NotificationDispatcherService } from '../notifications/services/notification-dispatcher.service';
import { IssueAssignee, IssuePriority, IssueStatus, User, UserRole } from '@bugflow-2026/shared-types';

describe('IssuesService', () => {
  let service: IssuesService;

  const issuesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const projectsRepo = {
    findOneBy: jest.fn(),
  };

  const realtimeService = {
    issueCreated: jest.fn(),
    issueUpdated: jest.fn(),
    issueDeleted: jest.fn(),
    commentCreated: jest.fn(),
    commentUpdated: jest.fn(),
    commentDeleted: jest.fn(),
    notificationCreated: jest.fn(),
  };

  const issueWatchersService = {
    watch: jest.fn(),
    unwatch: jest.fn(),
  };

  const notificationDispatcher = {
    notifyAssignee: jest.fn(),
    notifyIssueUpdated: jest.fn(),
    notifyWatchers: jest.fn(),
  };

  const actor: User = {
    id: 'actor-1',
    auth0Id: 'auth0|actor',
    email: 'actor@bugflow.com',
    name: 'Actor',
    role: UserRole.ADMIN,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  } as User;

  function makeIssue(overrides: Partial<IssueEntity> = {}): IssueEntity {
    return {
      id: 'issue-1',
      title: 'Original title',
      description: 'Original description',
      status: IssueStatus.OPEN,
      priority: IssuePriority.MEDIUM,
      assignee: undefined,
      projectId: null,
      project: undefined as any,
      comments: [],
      watchers: [],
      statusChangedAt: new Date('2026-01-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    } as IssueEntity;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuesService,
        { provide: RealtimeService, useValue: realtimeService },
        { provide: NotificationDispatcherService, useValue: notificationDispatcher },
        { provide: IssueWatchersService, useValue: issueWatchersService },
        { provide: getRepositoryToken(IssueEntity), useValue: issuesRepo },
        { provide: getRepositoryToken(ProjectEntity), useValue: projectsRepo },
      ],
    }).compile();

    service = module.get(IssuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw if project does not exist', async () => {
      projectsRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Bug',
          projectId: '123',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException if the issue does not exist', async () => {
      issuesRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.update('missing-id', {}, actor)).rejects.toThrow(NotFoundException);
      expect(issuesRepo.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if the issue disappears right after the update', async () => {
      const existing = makeIssue();
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(null);

      await expect(
        service.update('issue-1', { title: 'New title' }, actor),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates statusChangedAt only when the status actually changes', async () => {
      const existing = makeIssue({ status: IssueStatus.OPEN });
      const updated = makeIssue({ status: IssueStatus.IN_PROGRESS });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { status: IssueStatus.IN_PROGRESS }, actor);

      expect(issuesRepo.update).toHaveBeenCalledWith('issue-1', {
        statusChangedAt: expect.any(Date),
      });
    });

    it('does not touch statusChangedAt when status is not part of the payload', async () => {
      const existing = makeIssue();
      const updated = makeIssue({ title: 'New title' });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { title: 'New title' }, actor);

      expect(issuesRepo.update).toHaveBeenCalledTimes(1);
      expect(issuesRepo.update).not.toHaveBeenCalledWith('issue-1', {
        statusChangedAt: expect.any(Date),
      });
    });

    it('assigns a new assignee: watches it and notifies with no previous assignee', async () => {
      const newAssignee: IssueAssignee = { id: 'auth0|dev', dbId: 'dev-db-id', name: 'Dev' };
      const existing = makeIssue({ assignee: undefined });
      const updated = makeIssue({ assignee: newAssignee });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { assignee: newAssignee } as any, actor);

      expect(issueWatchersService.watch).toHaveBeenCalledWith('issue-1', 'dev-db-id');
      expect(notificationDispatcher.notifyAssignee).toHaveBeenCalledWith(updated, undefined);
    });

    it('reassigns from one user to another: watches the new one and passes the previous dbId', async () => {
      const prevAssignee: IssueAssignee = { id: 'auth0|tester', dbId: 'tester-db-id', name: 'Tester' };
      const newAssignee: IssueAssignee = { id: 'auth0|dev', dbId: 'dev-db-id', name: 'Dev' };
      const existing = makeIssue({ assignee: prevAssignee });
      const updated = makeIssue({ assignee: newAssignee });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { assignee: newAssignee } as any, actor);

      expect(issueWatchersService.watch).toHaveBeenCalledWith('issue-1', 'dev-db-id');
      expect(notificationDispatcher.notifyAssignee).toHaveBeenCalledWith(updated, 'tester-db-id');
    });

    it('unassigning notifies the previous assignee and does not call watch', async () => {
      const prevAssignee: IssueAssignee = { id: 'auth0|tester', dbId: 'tester-db-id', name: 'Tester' };
      const existing = makeIssue({ assignee: prevAssignee });
      const updated = makeIssue({ assignee: undefined });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { assignee: null } as any, actor);

      expect(issueWatchersService.watch).not.toHaveBeenCalled();
      expect(notificationDispatcher.notifyAssignee).toHaveBeenCalledWith(updated, 'tester-db-id');
    });

    it('does not touch watchers/notifyAssignee when the assignee does not change', async () => {
      const assignee: IssueAssignee = { id: 'auth0|dev', dbId: 'dev-db-id', name: 'Dev' };
      const existing = makeIssue({ assignee, title: 'Old' });
      const updated = makeIssue({ assignee, title: 'New' });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { title: 'New' } as any, actor);

      expect(issueWatchersService.watch).not.toHaveBeenCalled();
      expect(notificationDispatcher.notifyAssignee).not.toHaveBeenCalled();
    });

    it('notifies issue-updated when the title changes, using the actor as base actorUserId', async () => {
      const existing = makeIssue({ title: 'Old title' });
      const updated = makeIssue({ title: 'New title' });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { title: 'New title' } as any, actor);

      expect(notificationDispatcher.notifyIssueUpdated).toHaveBeenCalledWith(updated, ['actor-1']);
    });

    it.each([
      ['description', { description: 'New description' }],
      ['projectId', { projectId: 'project-2' }],
      ['status', { status: IssueStatus.CLOSED }],
      ['priority', { priority: IssuePriority.HIGH }],
    ])('notifies issue-updated when %s changes', async (_field, dto) => {
      const existing = makeIssue();
      const updated = makeIssue(dto as Partial<IssueEntity>);
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', dto as any, actor);

      expect(notificationDispatcher.notifyIssueUpdated).toHaveBeenCalled();
    });

    it('does not notify issue-updated when only the assignee changes', async () => {
      const newAssignee: IssueAssignee = { id: 'auth0|dev', dbId: 'dev-db-id', name: 'Dev' };
      const existing = makeIssue({ assignee: undefined });
      const updated = makeIssue({ assignee: newAssignee });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { assignee: newAssignee } as any, actor);

      expect(notificationDispatcher.notifyIssueUpdated).not.toHaveBeenCalled();
    });

    it('accumulates actorUserIds with previous and new assignee to avoid duplicate notifications', async () => {
      const prevAssignee: IssueAssignee = { id: 'auth0|tester', dbId: 'tester-db-id', name: 'Tester' };
      const newAssignee: IssueAssignee = { id: 'auth0|dev', dbId: 'dev-db-id', name: 'Dev' };
      const existing = makeIssue({ assignee: prevAssignee, title: 'Old' });
      const updated = makeIssue({ assignee: newAssignee, title: 'New' });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      await service.update('issue-1', { assignee: newAssignee, title: 'New' } as any, actor);

      expect(notificationDispatcher.notifyIssueUpdated).toHaveBeenCalledWith(updated, [
        'actor-1',
        'tester-db-id',
        'dev-db-id',
      ]);
    });

    it('returns the freshly updated issue entity', async () => {
      const existing = makeIssue();
      const updated = makeIssue({ title: 'New title' });
      issuesRepo.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);

      const result = await service.update('issue-1', { title: 'New title' } as any, actor);

      expect(result).toBe(updated);
    });
  });
});
