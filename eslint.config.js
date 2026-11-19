import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Lint rules are chosen to catch the mistakes that matter in a Worker
 * (floating promises, unchecked `any` crossing a trust boundary, dead code)
 * and to hold the structural limits the README states: no type assertions, no
 * file over 200 lines, no function over 40 lines, cyclomatic complexity of at
 * most 8, and no suppression comments. Style is Prettier's job.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'worker-configuration.d.ts',
      '.wrangler/**',
      // Compiled from src/shared/, which is linted.
      'public/js/shared/**',
    ],
  },
  {
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'no-console': 'error',
      'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'xxx', 'hack'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      complexity: ['error', { max: 8 }],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
    },
  },
  {
    // Shipped code keeps every function to a screen. Tests are exempt, since a
    // describe block is a list of cases, not a unit of logic.
    files: ['src/**/*.ts', 'public/**/*.js', 'scripts/**/*.mjs'],
    rules: { 'max-lines-per-function': ['error', { max: 40 }] },
  },
  {
    // The one module allowed to write to the console: the Logger adapter.
    files: ['src/infra/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // Front-end code is plain JavaScript typed through JSDoc; tsconfig.app.json
    // (DOM lib, checkJs) is the config that types it.
    files: ['public/**/*.js'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: false,
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { 'no-undef': 'error' },
  },
  {
    // Plain JavaScript run by Node, outside every tsconfig.
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    // Tests that run in jsdom rather than workerd are typed by tsconfig.dom.json,
    // which has the DOM lib and Node's types the Worker must not reach for.
    files: ['test/**/*.dom.test.ts', 'test/**/*.dom.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.dom.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Test doubles are async to satisfy the port they stand in for, even when
    // the fake has nothing to await.
    files: ['test/**/*.ts'],
    rules: { '@typescript-eslint/require-await': 'off' },
  },
);
