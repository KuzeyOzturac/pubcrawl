import {defineConfig} from '@playwright/test';

const liveUrl = process.env.TEST_BASE_URL;

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: liveUrl || 'http://127.0.0.1:4174/',
    browserName: 'chromium',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: liveUrl ? undefined : {
    command: 'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
