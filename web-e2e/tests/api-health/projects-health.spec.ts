import { test, expect } from '@playwright/test';

test.describe('API health (staging smoke test)', () => {
  test('GET /api/projects responds successfully when navigating the app', async ({ page }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(!process.env['BASE_URL'], 'It only runs against a deployed environment (BASE_URL set)');

    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/projects') && response.request().method() === 'GET',
    );

    await page.goto('/projects');

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
