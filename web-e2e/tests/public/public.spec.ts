import { test, expect } from '@playwright/test';

test('should display public landing page', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByText(
      /collaborative bug tracking made simple/i,
    ),
  ).toBeVisible();

  await expect(
    page.getByRole('button', {
      name: /login with auth0/i,
    }),
  ).toBeVisible();
});
