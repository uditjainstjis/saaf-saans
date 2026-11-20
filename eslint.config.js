/**
 * Lint configuration: typescript-eslint's strict type-checked rules plus the
 * size and safety limits CODE_QUALITY.md states, applied to source, front end,
 * tests and scripts alike, with inline suppressions switched off.
 */
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** The size limits every file is held to. */
const SIZE_LIMITS = {
  'max-lines': ['error', { max: 110, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
  complexity: ['error', { max: 8 }],
  'max-depth': ['error', 3],
  'max-params': ['error', 3],
};

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'worker-configuration.d.ts',
      // Dot-directories hold tooling state, not source.
      '.*/**',
      // Compiled from src/config/, which is linted.
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
      ...SIZE_LIMITS,
    },
  },
  {
    // The one module allowed to write to the console: the Logger adapter.
    files: ['src/lib/logger.ts'],
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
