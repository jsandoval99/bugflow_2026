import { expect, Page } from '@playwright/test';

export class ProjectsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/projects');
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole('heading', {
        name: /projects/i,
      }),
    ).toBeVisible();
  }
}
