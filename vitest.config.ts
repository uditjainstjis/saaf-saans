import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

/**
 * Two projects, because the suite has two different jobs.
 *
 * `workers` runs inside workerd, the runtime the Worker is deployed to, so the
 * Cache API, crypto, HTMLRewriter and Request/Response behave in tests as they
 * do in production. It is deliberately not pointed at wrangler.jsonc: Workers
 * AI has no local implementation, and every test injects fakes through the
 * ports in src/ports.ts, so the suite is hermetic and needs no credentials.
 *
 * `dom` runs in jsdom on Node for what workerd cannot host: axe-core, the
 * front-end modules in public/js/, and checks that read shipped files off disk.
 *
 * Coverage is measured over every TypeScript module in src/ and every
 * front-end module in public/js/ (the compiled copy of src/shared/ aside, which
 * is measured as its source), and gated at 100% for statements, branches,
 * functions and lines: below that, `npm test` fails.
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
