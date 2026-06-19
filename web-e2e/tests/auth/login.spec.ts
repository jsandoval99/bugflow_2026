import { test, expect } from '@playwright/test';

test('should display public landing page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL('/');

  await expect(
    page.getByRole('button', {
      name: /login/i,
    }),
  ).toBeVisible();
});
