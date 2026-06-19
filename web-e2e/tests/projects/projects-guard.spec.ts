import { test, expect } from '@playwright/test';

test('should redirect unauthenticated user from projects', async ({
  page,
}) => {
  await page.goto('/projects');

  await expect(
    page.getByRole('button', {
      name: /login with auth0/i,
    }),
  ).toBeVisible();
});
