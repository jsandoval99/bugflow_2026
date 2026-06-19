import { test, expect } from '@playwright/test';

test('should redirect unauthenticated user from issues', async ({
  page,
}) => {
  await page.goto('/issues');

  await expect(
    page.getByRole('button', {
      name: /login with auth0/i,
    }),
  ).toBeVisible();
});
