/**
 * The repository's own source files, read off disk, for the tests in
 * test/conventions/ that hold the tree to the rules CODE_QUALITY.md states.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();

/** One file of the repository: its path from the root, its text and its size. */
export interface RepoFile {
  path: string;
  text: string;
  bytes: number;
}

/** Every file under a directory with one of these extensions, generated files aside. */
export function filesIn(dir: string, extensions: readonly string[]): RepoFile[] {
  return readdirSync(resolve(ROOT, dir), { recursive: true, encoding: 'utf8' })
    .map((name) => join(dir, name))
    .filter((path) => extensions.some((ext) => path.endsWith(ext)))
    .filter((path) => !path.includes('public/js/shared/'))
    .map((path) => ({
      path,
      text: readFileSync(resolve(ROOT, path), 'utf8'),
      bytes: statSync(resolve(ROOT, path)).size,
    }));
}

/** The Worker's source modules. */
export const SOURCE = filesIn('src', ['.ts']);
/** The front-end modules. */
export const FRONT_END = filesIn('public/js', ['.js']);
/** The tests and their support modules. */
export const TESTS = filesIn('test', ['.ts']);
