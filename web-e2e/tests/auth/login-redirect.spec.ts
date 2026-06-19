import { test, expect } from '@playwright/test';

test('should redirect to auth0 login page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button').click();

  await page.waitForURL(/auth0\.com/i);

  await expect(page).toHaveURL(/auth0/i);
});
