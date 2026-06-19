import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { ProjectEntity } from '../modules/projects/entities/project.entity';
import { IssueEntity } from '../modules/issues/entities/issue.entity';
import { CommentEntity } from '../modules/comments/entities/comment.entity';
import { UserRole, IssuePriority, IssueStatus } from '@bugflow-2026/shared-types';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_NO_SSL === 'true'
    ? false
    : { rejectUnauthorized: false },
  entities: [
    User,
    ProjectEntity,
    IssueEntity,
    CommentEntity,
  ],
});

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
  if (process.env.ENABLE_SEED !== 'true') {
    throw new Error('Seed execution disabled');
  }

  await dataSource.initialize();

  try {
    console.log('🌱 Starting BugFlow seed...');

    const usersRepository =
      dataSource.getRepository(User);

    const projectsRepository =
      dataSource.getRepository(ProjectEntity);

    const issuesRepository =
      dataSource.getRepository(IssueEntity);

    const commentsRepository =
      dataSource.getRepository(CommentEntity);

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
          assignee: { id: developer1.auth0Id, name: developer1.name },
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
          assignee: { id: developer1.auth0Id, name: developer1.name },
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
        assignee: { id: developer1.auth0Id, name: developer1.name },
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
          assignee: { id: developer1.auth0Id, name: developer1.name },
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

    const projects = [
      bugflowProject,
      mobileProject,
      portalProject,
    ];
    const priorities = [
      IssuePriority.LOW,
      IssuePriority.MEDIUM,
      IssuePriority.HIGH,
    ];
    const statuses = [
      IssueStatus.OPEN,
      IssueStatus.IN_PROGRESS,
      IssueStatus.CLOSED,
    ];
    const issueTemplates = [
      'Login page validation fails',
      'Dashboard widget not rendering',
      'Issue status not updating',
      'Comment notification missing',
      'Project owner not assigned',
      'File upload exceeds limit',
      'Search results duplicated',
      'Mobile layout broken',
      'Auth0 redirect incorrect',
      'Pagination not working',
    ];
    const comments = [
      'Issue reproduced successfully.',
      'Unable to reproduce on staging.',
      'Needs further investigation.',
      'Root cause identified.',
      'Fix ready for QA.',
      'Verified and approved.',
    ];

    for (let i = 1; i <= 100; i++) {
      const template = issueTemplates[i % issueTemplates.length];
      const issue = await findOrCreateIssue(
        issuesRepository,
        {
          title: `${template} #${i}`,
          description: `Mock issue generated for testing record ${i}.`,
          status: statuses[i % statuses.length],
          priority: priorities[i % priorities.length],
          projectId: projects[i % projects.length].id,
          assignee: { id: developer1.auth0Id, name: developer1.name }
        },
      );
      await findOrCreateComment(
        commentsRepository,
        issue.id,
        comments[i % comments.length],
        tester1.id,
      );
    }

    console.log('📊 Seed summary');
    console.table({
      users: await usersRepository.count(),
      projects: await projectsRepository.count(),
      issues: await issuesRepository.count(),
      comments: await commentsRepository.count(),
    });

    console.log(
      '✅ BugFlow seed completed successfully',
    );

  } finally {
    await dataSource.destroy();
  }
}

bootstrap();
