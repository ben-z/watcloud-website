import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './visual-tests',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
    },
  },
});
