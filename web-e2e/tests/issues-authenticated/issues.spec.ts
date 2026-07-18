import { test, expect } from '@playwright/test';
import { IssuesPage } from '../../pages/issues.page';
import { mockCoreEndpoints, mockIssuesList, MOCK_ISSUE } from '../../fixtures/api-mocks';

test.describe('Issues (dev@bugflow.com)', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoreEndpoints(page);
    await mockIssuesList(page);
  });

  test('renders the mocked issue with status, priority and project', async ({ page }) => {
    const issuesPage = new IssuesPage(page);
    await issuesPage.goto();
    await issuesPage.expectLoaded();

    const issueCard = page.getByRole('article', { name: MOCK_ISSUE.title, exact: true });
    await expect(issueCard.getByText(MOCK_ISSUE.title)).toBeVisible();
    await expect(issueCard.getByText(MOCK_ISSUE.project.name)).toBeVisible();
  });

  test('creates a new issue and shows a success toast', async ({ page }) => {
    let createPayload: any = null;

    await page.route('**/api/issues', route => {
      if (route.request().method() === 'POST') {
        createPayload = route.request().postDataJSON();
        return route.fulfill({ json: { ...MOCK_ISSUE, id: 'new-issue-id' } });
      }
      return route.continue();
    });

    const issuesPage = new IssuesPage(page);
    await issuesPage.goto();
    await issuesPage.expectLoaded();

    await page.getByRole('button', { name: /create issue/i }).click();
    await page.getByLabel('Title').fill('New bug from e2e');
    await page.getByLabel('Description').fill('Created during an e2e test run');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByText(/issue created successfully/i)).toBeVisible();
    expect(createPayload).toMatchObject({
      title: 'New bug from e2e',
      description: 'Created during an e2e test run',
    });
  });
});
