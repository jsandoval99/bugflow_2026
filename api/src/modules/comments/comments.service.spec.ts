import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'shared-types/src/lib/user-role.enum';
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: RealtimeService,
          useValue: {
            emitToUser: jest.fn(),
            emitToProject: jest.fn(),
            emit: jest.fn(),
          },
        },
        {
          provide: NotificationDispatcherService,
          useValue: {
            dispatchCommentCreated: jest.fn(),
            dispatchIssueAssigned: jest.fn(),
            dispatchIssueUpdated: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CommentEntity),
          useValue: mockRepo,
        }, {
          provide: getRepositoryToken(IssueEntity),
          useValue: mockIssuesRepo,
        }, {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepo,
        },
      ],
    }).compile();

    service = module.get(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not allow editing another user comment', async () => {
    mockRepo.findOne.mockResolvedValue({
      id: '1',
      issueId: 'issue-1',
      authorId: 'owner-user',
      content: 'hello',
    });

    mockIssuesRepo.findOneBy.mockResolvedValue({
      id: 'issue-1',
      title: 'Bug title',
    });

    await expect(
      service.update(
        '1',
        { content: 'updated' },
        'different-user',
        {
          id: 'some-id',
          auth0Id: 'string',
          email: 'string',
          name: 'string',
          role: UserRole.TESTER,
          createdAt: new Date(),
        }
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
