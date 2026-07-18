 /* eslint-disable playwright/no-conditional-in-test */
import { test, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../.auth/dev-user.json');

test('authenticate as dev@bugflow.com', async ({ page }) => {
  const email = process.env['E2E_USER_EMAIL'];
  const password = process.env['E2E_USER_PASSWORD'];

  if (!email || !password) {
    throw new Error(
      'Missing E2E_USER_EMAIL / E2E_USER_PASSWORD environment variables. ' +
      'Authentication with Auth0 cannot proceed without these variables.',
    );
  }

  await page.goto('/');
  await page.getByRole('button', { name: /login with auth0/i }).click();
  await page.waitForURL(/auth0\.com/i);

  await page.getByLabel('Email address').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);

  await page.locator('button[data-action-button-primary="true"]').click();

  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
