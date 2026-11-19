import { defineConfig, devices } from '@playwright/test';

// UX checks (docs/design/03-tooling.md §5). Unit tests are Vitest's (src/**/*.test.ts).
const PORT = 5174;

export default defineConfig({
  testDir: 'tests/ux',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: process.env.CI ? 2 : '50%',
  forbidOnly: !!process.env.CI,
  reporter: [['line']],
  outputDir: 'test-results',
  // Visual baselines (tests/ux/visual.spec.ts), committed; one set, no per-platform suffix.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 1,
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: `node node_modules/vite/bin/vite.js --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
