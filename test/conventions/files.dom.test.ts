/**
 * Holds every file to the conventions CODE_QUALITY.md states: an opening
 * comment naming its one job, a doc comment on every export, and a size small
 * enough to read in one sitting. Line and function limits are in eslint.config.js.
 */
import { expect, it } from 'vitest';
import { FRONT_END, type RepoFile, SOURCE, TESTS, filesIn } from '../support/repo.dom';

/** The paths of the files for which `fails` is true. */
const failing = (files: readonly RepoFile[], fails: (file: RepoFile) => boolean): string[] =>
  files.filter(fails).map((file) => file.path);

/** True when some export of the file has no doc comment on the line above it. */
function hasUndocumentedExport({ text }: RepoFile): boolean {
  const lines = text.split('\n');
  return lines.some(
    (line, i) => /^export (?!default)/.test(line) && !(lines[i - 1] ?? '').trim().endsWith('*/'),
  );
}

it('finds the whole tree, not an empty listing', () => {
  expect(SOURCE.length).toBeGreaterThan(80);
  expect(FRONT_END.length).toBeGreaterThan(8);
  expect(TESTS.length).toBeGreaterThan(80);
});

it('opens every TypeScript file with a comment saying what its one job is', () => {
  expect(failing([...SOURCE, ...TESTS], (file) => !file.text.startsWith('/**\n'))).toEqual([]);
});

it('opens every front-end module with type checking on and a comment on its job', () => {
  expect(failing(FRONT_END, (file) => !file.text.startsWith('// @ts-check\n/**'))).toEqual([]);
});

it('documents every export of the Worker, the front end and the test support modules', () => {
  const support = TESTS.filter((file) => file.path.includes('/support/'));
  expect(failing([...SOURCE, ...FRONT_END, ...support], hasUndocumentedExport)).toEqual([]);
});

it('keeps every source module under 3.5 KB and every test file under 4 KB', () => {
  expect(failing([...SOURCE, ...FRONT_END], (file) => file.bytes > 3500)).toEqual([]);
  expect(failing(TESTS, (file) => file.bytes > 4000)).toEqual([]);
});

it('keeps every stylesheet under 4 KB', () => {
  expect(failing(filesIn('public/css', ['.css']), (file) => file.bytes > 4000)).toEqual([]);
});

it('has a test file beside the name of every feature, lib and middleware folder', () => {
  const tested = new Set(TESTS.map((file) => file.path.split('/').slice(1, -1).join('/')));
  const folders = new Set(SOURCE.map((file) => file.path.split('/').slice(1, -1).join('/')));
  const untested = [...folders].filter((folder) => folder !== '' && !tested.has(folder));
  // Factor families and screening rules are data, tested through their index and the scanner.
  expect(untested.sort()).toEqual(['features/impact/factors', 'lib/prompt-guard/rules']);
});
