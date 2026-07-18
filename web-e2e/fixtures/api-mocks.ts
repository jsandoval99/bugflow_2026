import { Page } from '@playwright/test';

export const DEV_USER = {
  id: 'db-dev-e2e',
  auth0Id: 'auth0|69f2563b3c96810728a34067',
  email: 'dev@bugflow.com',
  name: 'dev@bugflow.com',
  role: 'developer',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const MOCK_PROJECT = {
  id: 'proj-e2e-1',
  name: 'BugFlow Internal',
  description: 'Internal BugFlow platform',
  ownerId: DEV_USER.auth0Id,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const MOCK_ISSUE = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  title: 'Login fails on Safari',
  description: 'Authentication flow fails on Safari browsers.',
  status: 'open',
  priority: 'high',
  assignee: { id: DEV_USER.auth0Id, dbId: DEV_USER.id, name: DEV_USER.name },
  project: { id: MOCK_PROJECT.id, name: MOCK_PROJECT.name },
  projectId: MOCK_PROJECT.id,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export async function mockCoreEndpoints(page: Page) {
  await page.route('**/api/users/me', route => route.fulfill({ json: DEV_USER }));
  await page.route('**/api/users/assignable', route => route.fulfill({ json: [DEV_USER] }));
  await page.route('**/api/notifications', route => route.fulfill({ json: [] }));

  await page.route('**/api/projects', route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: [MOCK_PROJECT] });
    }
    return route.continue();
  });
}

export async function mockIssuesList(page: Page, issues = [MOCK_ISSUE]) {
  await page.route('**/api/issues?*', route => {
    if (route.request().method() !== 'GET') return route.continue();
    route.fulfill({
      json: { data: issues, total: issues.length, page: 1, pageSize: 10, totalPages: 1 },
    });
  });
}

export async function mockIssueWatch(page: Page, issueId: string, isWatching = false) {
  await page.route(`**/api/issues/${issueId}/watch`, route => {
    const method = route.request().method();
    if (method === 'GET') return route.fulfill({ json: isWatching });
    return route.fulfill({ json: {} }); // POST/DELETE
  });
}
