import { defineConfig } from '@playwright/test';
// PORTAL_TEST_PORT lets tests run when 4173 is taken by another local server.
const origin = `http://127.0.0.1:${process.env.PORTAL_TEST_PORT || 4173}`;
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: { baseURL: `${origin}/ro_tools_portal/`, browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: { command: `npx vite preview --host 127.0.0.1 --port ${process.env.PORTAL_TEST_PORT || 4173} --strictPort`, url: `${origin}/ro_tools_portal/`, reuseExistingServer: false },
});
