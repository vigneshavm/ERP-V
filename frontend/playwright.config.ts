import { defineConfig, devices } from '@playwright/test';

// NOTE (fixed as part of adding the broader e2e suite in e2e/): this used to default to 3001,
// but `vite.config.ts`'s dev server (`npm run dev`) actually listens on 3000 and nothing here
// ever passed 3000 to Vite. That meant a from-cold `npm run test:e2e` (no dev server already
// running) started Vite on 3000 while Playwright polled 3001 for `webServer.url`, and just sat
// there until the 120s startup timeout. `reuseExistingServer: true` masked this whenever a dev
// server happened to already be running on 3000, so it wasn't obvious. Override with
// `PORT=<port> npx playwright test` if you deliberately run Vite on a different port.
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,
    navigationTimeout: 20 * 1000,
  },
  projects: [
    // Uses the bundled Chromium (installed via `npx playwright install chromium`), so this
    // project always works — including in CI — without depending on a system Chrome/Edge
    // install. Prefer it with `npx playwright test --project=chromium` if `chrome`/`msedge`
    // below aren't installed on your machine.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // These use the real, locally-installed browser (channel, not the bundled one) -- handy for
    // matching exactly what your users run, but they require Chrome/Edge to actually be
    // installed on the machine running the tests.
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: process.platform === 'win32' ? 'cmd /c npm run dev' : 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
