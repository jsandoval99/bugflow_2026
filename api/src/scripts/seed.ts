import 'dotenv/config';
import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { ProjectEntity } from '../modules/projects/entities/project.entity';
import { IssueEntity } from '../modules/issues/entities/issue.entity';
import { CommentEntity } from '../modules/comments/entities/comment.entity';
import { IssueWatcherEntity } from '../modules/issues/entities/issue-watcher.entity';
import { NotificationEntity } from '../modules/notifications/entities/notification.entity';
import { UserRole, IssuePriority, IssueStatus, IssueAssignee } from '@bugflow-2026/shared-types';

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
    IssueWatcherEntity,
    CommentEntity,
    NotificationEntity,
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

// ---- Random data helpers (no external libs needed) ----
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Picks a "random-ish" assignee among the assignable users (developer/tester),
 * with a chance of leaving the issue unassigned. Admin is intentionally excluded
 * since it's not one of the assignable roles per the app's business rules.
 */
function pickRandomAssignee(
  assignableUsers: User[],
  unassignedChance = 0.15,
): IssueAssignee | undefined {
  if (Math.random() < unassignedChance) {
    return undefined;
  }
  const user = pickRandom(assignableUsers);
  return { id: user.auth0Id, dbId: user.id, name: user.name };
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

    // Only developer/tester are assignable per the app's business rules
    const assignableUsers = [developer1, tester1];

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

    const analyticsProject =
      await findOrCreateProject(
        projectsRepository,
        {
          name: 'Analytics Dashboard',
          description:
            'Internal reporting and analytics platform',
          ownerId: admin.id,
        },
      );

    const paymentsProject =
      await findOrCreateProject(
        projectsRepository,
        {
          name: 'Payment Gateway',
          description:
            'Payment processing and billing service',
          ownerId: developer1.id,
        },
      );

    const projects = [
      bugflowProject,
      mobileProject,
      portalProject,
      analyticsProject,
      paymentsProject,
    ];

    // ---- 4 "hand-picked" issues, kept exactly as before since their comments depend on them ----
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
          assignee: { id: developer1.auth0Id, dbId: developer1.id, name: developer1.name },
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
          assignee: { id: developer1.auth0Id, dbId: developer1.id, name: developer1.name },
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
        assignee: { id: developer1.auth0Id, dbId: developer1.id, name: developer1.name },
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
          assignee: { id: developer1.auth0Id, dbId: developer1.id, name: developer1.name },
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

    // ---- Remaining issues, generated with varied combinations to avoid repetition ----
    // 10 components x 10 problem types = 100 unique title combinations.
    // We already used 4 issues above, so we generate 96 more for a total of 100.
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
    const components = [
      'Login',
      'Dashboard',
      'Search',
      'File upload',
      'Payment checkout',
      'Notification center',
      'User profile',
      'Project settings',
      'Data export',
      'Comment thread',
    ];
    const problemTypes = [
      'fails on submit',
      'is not responsive on mobile',
      'shows incorrect data',
      'crashes intermittently',
      'is missing input validation',
      'has broken styling',
      'is slow to load',
      'does not update in real-time',
      'throws an unexpected error',
      'ignores user permissions',
    ];
    const descriptionContexts = [
      'Multiple users have reported this issue during regular usage.',
      'This was discovered during QA regression testing.',
      'Customer support flagged this as a recurring complaint.',
      'Occurs intermittently under normal load conditions.',
      'First noticed after the latest deployment.',
      'Impacts both desktop and mobile experiences.',
      'Steps to reproduce are inconsistent but occurrence is frequent.',
      'Confirmed on multiple browsers and environments.',
      'Was working correctly in the previous release.',
      'Flagged as a blocker for the upcoming sprint.',
    ];
    const comments = [
      'Issue reproduced successfully.',
      'Unable to reproduce on staging.',
      'Needs further investigation.',
      'Root cause identified.',
      'Fix ready for QA.',
      'Verified and approved.',
    ];

    let generatedCount = 0;

    for (const component of components) {
      for (const problemType of problemTypes) {
        if (generatedCount >= 96) break;

        const project = pickRandom(projects);
        const description = `${component} ${problemType}. ${pickRandom(descriptionContexts)}`;

        const issue = await findOrCreateIssue(
          issuesRepository,
          {
            title: `${component} ${problemType}`,
            description,
            status: pickRandom(statuses),
            priority: pickRandom(priorities),
            projectId: project.id,
            assignee: pickRandomAssignee(assignableUsers),
          },
        );

        await findOrCreateComment(
          commentsRepository,
          issue.id,
          pickRandom(comments),
          tester1.id,
        );

        generatedCount++;
      }
      if (generatedCount >= 96) break;
    }

    const summary = {
      users: await usersRepository.count(),
      projects: await projectsRepository.count(),
      issues: await issuesRepository.count(),
      comments: await commentsRepository.count(),
    };

    console.log(`
    ========================================
    🌱 BugFlow Seed Summary 📊
    ========================================
    👤 Users:      ${summary.users}
    📁 Projects:   ${summary.projects}
    🎫 Issues:     ${summary.issues}
    💬 Comments:   ${summary.comments}
    ========================================
    `);

    console.log(
      '✅ BugFlow seed completed successfully',
    );

  } finally {
    await dataSource.destroy();
  }
}

bootstrap();
