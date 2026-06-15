import { NestFactory } from '@nestjs/core';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app/app.module';
import { User } from '../modules/users/entities/user.entity';
import { ProjectEntity } from '../modules/projects/entities/project.entity';
import { IssueEntity } from '../modules/issues/entities/issue.entity';
import { CommentEntity } from '../modules/comments/entities/comment.entity';
import { UserRole, IssuePriority, IssueStatus } from '@bugflow-2026/shared-types';

async function findOrCreateUser(repository: Repository<User>, data: Partial<User>): Promise<User> {
  const existing = await repository.findOne({
    where: { email: data.email },
  });

  if (existing) {
    return existing;
  }

  return repository.save(
    repository.create(data),
  );
}

async function findOrCreateProject(repository: Repository<ProjectEntity>, data: Partial<ProjectEntity>): Promise<ProjectEntity> {
  const existing = await repository.findOne({
    where: { name: data.name },
  });

  if (existing) {
    return existing;
  }

  return repository.save(
    repository.create(data),
  );
}

async function findOrCreateIssue(repository: Repository<IssueEntity>, data: Partial<IssueEntity>): Promise<IssueEntity> {
  const existing = await repository.findOne({
  where: { title: data.title },
  });

  if (existing) {
    return existing;
  }

  return repository.save(
    repository.create(data),
  );
}

async function findOrCreateComment(
  repository: Repository<CommentEntity>,
  issueId: string,
  content: string,
  authorId: string,
): Promise<void> {
  const existing = await repository.findOne({
    where: {
      issueId,
      content,
    },
  });

  if (existing) {
    return;
  }

  await repository.save(
    repository.create({
      issueId,
      authorId,
      content,
    })
  );
}

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed execution is disabled in production');
  }

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🌱 Starting BugFlow seed...');

    const usersRepository =
      app.get<Repository<User>>(
        getRepositoryToken(User),
      );

    const projectsRepository =
      app.get<Repository<ProjectEntity>>(
        getRepositoryToken(ProjectEntity),
      );

    const issuesRepository =
      app.get<Repository<IssueEntity>>(
        getRepositoryToken(IssueEntity),
      );

    const commentsRepository =
      app.get<Repository<CommentEntity>>(
        getRepositoryToken(CommentEntity),
      );

    const admin =
      await findOrCreateUser(
        usersRepository,
        {
          auth0Id: 'auth0|69d44d23cf1c087a514ab35b',
          email: 'test@bugflow.com',
          name: 'Cesar Bugflow Test',
          role: UserRole.ADMIN,
        },
      );

    const developer1 =
      await findOrCreateUser(
        usersRepository,
        {
          auth0Id: 'auth0|69f2563b3c96810728a34067',
          email: 'dev@bugflow.com',
          name: 'dev@bugflow.com',
          role: UserRole.DEVELOPER,
        },
      );

    const tester1 =
      await findOrCreateUser(
        usersRepository,
        {
          auth0Id: 'auth0|69f2562a83cf251989410cc7',
          email: 'tester@bugflow.com',
          name: 'Fernando',
          role: UserRole.TESTER,
        },
      );

    const bugflowProject =
      await findOrCreateProject(
        projectsRepository,
        {
          name: 'BugFlow Internal',
          description:
            'Internal BugFlow platform',
          ownerId: admin.id,
        },
      );

    const mobileProject =
      await findOrCreateProject(
        projectsRepository,
        {
          name: 'Mobile App',
          description:
            'Customer mobile application',
          ownerId: developer1.id,
        },
      );

    const portalProject =
      await findOrCreateProject(
        projectsRepository,
        {
          name: 'Customer Portal',
          description:
            'Main customer web portal',
          ownerId: developer1.id,
        },
      );

    const issue1 =
      await findOrCreateIssue(
        issuesRepository,
        {
          title: 'Login fails on Safari',
          description:
            'Authentication flow fails on Safari browsers.',
          status: IssueStatus.OPEN,
          priority: IssuePriority.HIGH,
          projectId: bugflowProject.id,
          assignee: developer1.id,
        },
      );

    const issue2 =
      await findOrCreateIssue(
        issuesRepository,
        {
          title:
            'Dashboard statistics mismatch',
          description:
            'Displayed statistics do not match database totals.',
          status:
            IssueStatus.IN_PROGRESS,
          priority:
            IssuePriority.MEDIUM,
          projectId: bugflowProject.id,
          assignee: developer1.id,
        },
      );

    await findOrCreateIssue(
      issuesRepository,
      {
        title:
          'Project creation validation missing',
        description:
          'Projects can be created with invalid data.',
        status: IssueStatus.OPEN,
        priority:
          IssuePriority.HIGH,
        projectId: portalProject.id,
        assignee: developer1.id,
      },
    );

    const issue4 =
      await findOrCreateIssue(
        issuesRepository,
        {
          title:
            'Issue comments not refreshing',
          description:
            'Comments require manual page refresh.',
          status:
            IssueStatus.CLOSED,
          priority:
            IssuePriority.LOW,
          projectId: mobileProject.id,
          assignee: developer1.id,
        },
      );

    await findOrCreateComment(
      commentsRepository,
      issue1.id,
      'Issue reproduced successfully.',
      tester1.id,
    );

    await findOrCreateComment(
      commentsRepository,
      issue1.id,
      'Investigating root cause.',
      developer1.id,
    );

    await findOrCreateComment(
      commentsRepository,
      issue2.id,
      'Ready for QA testing.',
      developer1.id,
    );

    await findOrCreateComment(
      commentsRepository,
      issue4.id,
      'Fixed in latest build.',
      developer1.id,
    );

    console.log(
      '✅ BugFlow seed completed successfully',
    );

  } finally {
    await app.close();
  }
}

bootstrap();
