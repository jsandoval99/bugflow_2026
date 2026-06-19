import { test, expect } from '@playwright/test';

test('should redirect unauthenticated user from dashboard', async ({
  page,
}) => {
  await page.goto('/dashboard');

  await expect(
    page.getByRole('button', {
      name: /login with auth0/i,
    }),
  ).toBeVisible();
});
