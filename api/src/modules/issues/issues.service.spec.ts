import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { IssuesService } from './issues.service';
import { IssueEntity } from './entities/issue.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { Auth0Service } from '../auth/auth0.service';
import { RealtimeService } from '../realtime/services/realtime.service';
import { IssueWatchersService } from './issue-watchers.service';
import { NotificationDispatcherService } from '../notifications/services/notification-dispatcher.service';

describe('IssuesService', () => {
  let service: IssuesService;

  const issuesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const projectsRepo = {
    findOneBy: jest.fn(),
  };

  const auth0Service = {
    getCachedUsers: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssuesService,
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
            notifyAssignee: jest.fn(),
            notifyIssueUpdated: jest.fn(),
            notifyWatchers: jest.fn(),
          },
        },
        {
          provide: IssueWatchersService,
          useValue: {
            watch: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(IssueEntity),
          useValue: issuesRepo,
        },
        {
          provide: getRepositoryToken(ProjectEntity),
          useValue: projectsRepo,
        },
        {
          provide: Auth0Service,
          useValue: auth0Service,
        },
      ],
    }).compile();

    service = module.get(IssuesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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
