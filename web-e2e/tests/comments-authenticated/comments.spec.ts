import { test, expect } from '@playwright/test';
import { IssuesPage } from '../../pages/issues.page';
import { mockCoreEndpoints, mockIssuesList, mockIssueWatch, MOCK_ISSUE, DEV_USER } from '../../fixtures/api-mocks';

test.describe('Comments on an issue (dev@bugflow.com)', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoreEndpoints(page);
    await mockIssuesList(page);
    await mockIssueWatch(page, MOCK_ISSUE.id);
  });

  test('lists existing comments and submits a new one', async ({ page }) => {
    const existingComment = {
      id: 'comment-e2e-1',
      content: 'Reproduced on the latest build.',
      authorId: DEV_USER.auth0Id,
      issueId: MOCK_ISSUE.id,
      author: { id: DEV_USER.auth0Id, name: DEV_USER.name },
      createdAt: '2026-01-02T00:00:00.000Z',
    };
    const newComment = {
      id: 'comment-e2e-2',
      content: 'Confirmed fix in staging.',
      authorId: DEV_USER.auth0Id,
      issueId: MOCK_ISSUE.id,
      author: { id: DEV_USER.auth0Id, name: DEV_USER.name },
      createdAt: '2026-01-03T00:00:00.000Z',
    };

    let createdCommentPayload: any = null;
    let commentWasCreated = false;

    await page.route(`**/api/issues/${MOCK_ISSUE.id}/comments`, route => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({
          json: commentWasCreated ? [existingComment, newComment] : [existingComment],
        });
      }
      if (method === 'POST') {
        createdCommentPayload = route.request().postDataJSON();
        commentWasCreated = true;
        return route.fulfill({ json: newComment });
      }
      return route.continue();
    });

    const issuesPage = new IssuesPage(page);
    await issuesPage.goto();
    await issuesPage.expectLoaded();

    await page.getByRole('button', { name: /view details/i }).first().click();
    await expect(page.getByText('Reproduced on the latest build.')).toBeVisible();

    await page.getByPlaceholder('Add a comment...').fill('Confirmed fix in staging.');
    await page.getByRole('button', { name: /add comment/i }).click();

    await expect(page.getByText('Confirmed fix in staging.')).toBeVisible();
    await expect(page.getByPlaceholder('Add a comment...')).toHaveValue('');
    expect(createdCommentPayload).toMatchObject({
      content: 'Confirmed fix in staging.',
    });
  });
});
