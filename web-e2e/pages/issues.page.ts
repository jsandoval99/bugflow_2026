import { expect, Page } from '@playwright/test';

export class IssuesPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/issues');
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole('heading', {
        name: /issues/i,
      }),
    ).toBeVisible();
  }
}
