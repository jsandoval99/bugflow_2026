import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';
const isRemoteTarget = !!process.env['BASE_URL'];
const authFile = '.auth/dev-user.json';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './tests' }),

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['html', { open: 'never' }]],

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  expect: {
    timeout: 10000,
  },

  webServer: isRemoteTarget
    ? undefined
    : {
        command: 'npx nx run web:serve',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env.CI,
        cwd: workspaceRoot,
      },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: [/auth\.setup\.ts/, /issues-authenticated/, /comments-authenticated/, /api-health/],
    },
    {
      name: 'chromium-authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testMatch: [/issues-authenticated/, /comments-authenticated/, /api-health/],
    },
  ],
});
