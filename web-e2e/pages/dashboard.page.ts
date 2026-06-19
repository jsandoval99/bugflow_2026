import { expect, Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole('heading', {
        name: /dashboard/i,
      }),
    ).toBeVisible();
  }
}
