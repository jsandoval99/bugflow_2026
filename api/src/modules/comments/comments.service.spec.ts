import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationType, UserRole } from '@bugflow-2026/shared-types';
import { CommentsService } from './comments.service';
import { RealtimeService } from '../realtime/services/realtime.service';
import { NotificationDispatcherService } from '../notifications/services/notification-dispatcher.service';
import { CommentEntity } from './entities/comment.entity';
import { IssueEntity } from '../issues/entities/issue.entity';
import { User } from '../users/entities/user.entity';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  const mockIssuesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUsersRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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

  const notificationDispatcher = {
    notifyAssignee: jest.fn(),
    notifyWatchers: jest.fn(),
    notifyReporter: jest.fn(),
    notifyIssueUpdated: jest.fn(),
    notifyCommentAdded: jest.fn(),
  };

  const owner: User = {
    id: 'owner-id',
    auth0Id: 'auth0|owner',
    email: 'owner@bugflow.com',
    name: 'Owner',
    role: UserRole.TESTER,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  } as User;

  function makeIssue(overrides: Partial<IssueEntity> = {}): IssueEntity {
    return {
      id: 'issue-1',
      title: 'Bug title',
      description: 'desc',
      status: 'open',
      priority: 'medium',
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

  function makeComment(overrides: Partial<CommentEntity> = {}): CommentEntity {
    return {
      id: 'comment-1',
      content: 'hello',
      authorId: 'owner-id',
      issueId: 'issue-1',
      issue: undefined as any,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    } as CommentEntity;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: RealtimeService, useValue: realtimeService },
        { provide: NotificationDispatcherService, useValue: notificationDispatcher },
        { provide: getRepositoryToken(CommentEntity), useValue: mockRepo },
        { provide: getRepositoryToken(IssueEntity), useValue: mockIssuesRepo },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
      ],
    }).compile();

    service = module.get(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws NotFoundException if the issue does not exist', async () => {
      mockIssuesRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create('missing-issue', { content: 'hi' }, 'owner-id', owner),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('creates the comment and notifies watchers/reporter via notifyCommentAdded', async () => {
      const issue = makeIssue();
      const created = makeComment({ content: 'hi' });
      mockIssuesRepo.findOneBy.mockResolvedValue(issue);
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create('issue-1', { content: 'hi' }, 'owner-id', owner);

      expect(mockRepo.create).toHaveBeenCalledWith({
        content: 'hi',
        issueId: 'issue-1',
        authorId: 'owner-id',
      });
      expect(notificationDispatcher.notifyCommentAdded).toHaveBeenCalledWith(
        issue,
        [owner.id],
        owner.name,
      );
      expect(realtimeService.commentCreated).toHaveBeenCalledWith('issue-1');
      expect(result).toBe(created);
    });

    it('falls back to email when the actor has no name', async () => {
      const issue = makeIssue();
      const userWithoutName = { ...owner, name: '' } as User;
      mockIssuesRepo.findOneBy.mockResolvedValue(issue);
      mockRepo.create.mockReturnValue(makeComment());
      mockRepo.save.mockResolvedValue(makeComment());

      await service.create('issue-1', { content: 'hi' }, 'owner-id', userWithoutName);

      expect(notificationDispatcher.notifyCommentAdded).toHaveBeenCalledWith(
        issue,
        [userWithoutName.id],
        userWithoutName.email,
      );
    });
  });

  describe('findAll', () => {
    it('resolves author name for known users and falls back to Unknown otherwise', async () => {
      const comments = [
        makeComment({ id: 'c1', authorId: 'auth0|known' }),
        makeComment({ id: 'c2', authorId: 'auth0|ghost' }),
      ];
      mockRepo.find.mockResolvedValue(comments);
      mockUsersRepo.find.mockResolvedValue([
        { auth0Id: 'auth0|known', name: 'Known User' },
      ]);

      const result = await service.findAll('issue-1');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { issueId: 'issue-1' },
        order: { createdAt: 'DESC' },
      });
      expect(mockUsersRepo.find).toHaveBeenCalledWith({
        where: { auth0Id: expect.anything() },
      });
      expect(result[0].author).toEqual({ id: 'auth0|known', name: 'Known User' });
      expect(result[1].author).toEqual({ id: 'auth0|ghost', name: 'Unknown' });
    });

    it('returns an empty array without querying users when there are no comments', async () => {
      mockRepo.find.mockResolvedValue([]);
      mockUsersRepo.find.mockResolvedValue([]);

      const result = await service.findAll('issue-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if the comment does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns only the comment content', async () => {
      mockRepo.findOne.mockResolvedValue(makeComment({ content: 'the content' }));

      const result = await service.findOne('comment-1');

      expect(result).toBe('the content');
    });
  });

  describe('update', () => {
    it('throws NotFoundException if the comment does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('missing', { content: 'x' }, 'owner-id', owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if the parent issue does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(makeComment());
      mockIssuesRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update('comment-1', { content: 'x' }, 'owner-id', owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('does not allow editing another user comment', async () => {
      mockRepo.findOne.mockResolvedValue(makeComment({ authorId: 'someone-else' }));
      mockIssuesRepo.findOneBy.mockResolvedValue(makeIssue());

      await expect(
        service.update('comment-1', { content: 'updated' }, 'owner-id', owner),
      ).rejects.toThrow(ForbiddenException);

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('updates the content and notifies watchers with COMMENT_EDITED', async () => {
      const existing = makeComment({ content: 'old' });
      const issue = makeIssue({ title: 'Bug title' });
      mockRepo.findOne.mockResolvedValue(existing);
      mockIssuesRepo.findOneBy.mockResolvedValue(issue);
      mockRepo.save.mockImplementation(async c => c);

      const result = await service.update('comment-1', { content: 'new' }, 'owner-id', owner);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'new' }),
      );
      expect(notificationDispatcher.notifyWatchers).toHaveBeenCalledWith(
        issue,
        NotificationType.COMMENT_EDITED,
        `${owner.name} updated a comment to "${issue.title}"`,
      );
      expect(realtimeService.commentUpdated).toHaveBeenCalledWith('issue-1');
      expect(result.content).toBe('new');
    });
  });

  describe('remove', () => {
    it('throws NotFoundException if the comment does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('missing', 'owner-id', owner)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if the parent issue does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(makeComment());
      mockIssuesRepo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('comment-1', 'owner-id', owner)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not allow deleting another user comment', async () => {
      mockRepo.findOne.mockResolvedValue(makeComment({ authorId: 'someone-else' }));
      mockIssuesRepo.findOneBy.mockResolvedValue(makeIssue());

      await expect(service.remove('comment-1', 'owner-id', owner)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockRepo.remove).not.toHaveBeenCalled();
    });

    it('removes the comment and notifies watchers with COMMENT_DELETED', async () => {
      const existing = makeComment();
      const issue = makeIssue({ title: 'Bug title' });
      mockRepo.findOne.mockResolvedValue(existing);
      mockIssuesRepo.findOneBy.mockResolvedValue(issue);

      const result = await service.remove('comment-1', 'owner-id', owner);

      expect(mockRepo.remove).toHaveBeenCalledWith(existing);
      expect(notificationDispatcher.notifyWatchers).toHaveBeenCalledWith(
        issue,
        NotificationType.COMMENT_DELETED,
        `${owner.name} removed a comment to "${issue.title}"`,
      );
      expect(realtimeService.commentDeleted).toHaveBeenCalledWith('issue-1');
      expect(result).toEqual({ success: true });
    });
  });
});
