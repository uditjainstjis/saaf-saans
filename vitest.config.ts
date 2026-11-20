/**
 * Test configuration: two projects, because the code runs in two places, and
 * one coverage gate at 100% over src/ and public/js/ (the compiled copy of
 * src/config aside, which is measured as its source). TESTING.md explains both.
 */
import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

/**
 * `workers` runs inside workerd, the runtime the Worker is deployed to. It is
 * deliberately not pointed at wrangler.jsonc: Workers AI has no local
 * implementation, and every test injects fakes through ports, so the suite is
 * hermetic. `dom` runs in jsdom for the page, axe-core and shipped-file checks.
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          cloudflareTest({
            miniflare: {
              compatibilityDate: '2026-08-22',
              compatibilityFlags: ['nodejs_compat'],
            },
          }),
        ],
        test: {
          name: 'workers',
          include: ['test/**/*.test.ts'],
          exclude: ['test/**/*.dom.test.ts'],
        },
      },
      {
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['test/**/*.dom.test.ts'],
          // axe-core audits a full page per test; on a loaded CI runner that can pass five seconds.
          testTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: 'istanbul',
      reporter: [['text', { skipFull: false }], 'json-summary'],
      include: ['src/**/*.ts', 'public/js/**/*.js'],
      exclude: ['public/js/shared/**'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
