/**
 * Holds the dependency direction CODE_QUALITY.md states: config at the bottom,
 * then lib, middleware, the features in order, and the application shell on
 * top. A module may import its own unit or a lower layer, never a higher one.
 */
import { dirname, join } from 'node:path';
import { expect, it } from 'vitest';
import { type RepoFile, SOURCE } from '../support/repo.dom';

/** Layers from the bottom up; units in one layer may not import each other. */
const LAYERS: readonly (readonly string[])[] = [
  ['src/config'],
  ['src/lib'],
  ['src/middleware'],
  ['src/features/air-quality', 'src/features/impact'],
  ['src/features/plan'],
  ['src/features/assistant'],
  ['src/app.ts'],
  ['src/index.ts'],
];

/** The unit a path belongs to, and its layer's height. */
function placeOf(path: string): { unit: string; height: number } {
  const height = LAYERS.findIndex((units) => units.some((unit) => path.startsWith(unit)));
  const unit = LAYERS[height]?.find((candidate) => path.startsWith(candidate)) ?? path;
  return { unit, height };
}

/** The project files a module imports, as paths from the root. */
const importsOf = ({ path, text }: RepoFile): string[] =>
  [...text.matchAll(/from '(\.[^']*)'/g)].map((match) => join(dirname(path), match[1] ?? ''));

/** Imports that point sideways or upwards, as "importer -> imported". */
function violations(): string[] {
  return SOURCE.flatMap((file) => {
    const own = placeOf(file.path);
    return importsOf(file)
      .filter((imported) => {
        const other = placeOf(imported);
        return other.unit !== own.unit && other.height >= own.height;
      })
      .map((imported) => `${file.path} -> ${imported}`);
  });
}

it('places every source module in a layer', () => {
  expect(SOURCE.filter((file) => placeOf(file.path).height === -1)).toEqual([]);
});

it('lets no module import sideways or upwards', () => {
  expect(violations()).toEqual([]);
});

it('keeps the files compiled for the page free of imports', () => {
  const standalone = ['options', 'limits', 'labels', 'security-policy'];
  const files = SOURCE.filter((file) => standalone.some((n) => file.path === `src/config/${n}.ts`));
  expect(files).toHaveLength(4);
  expect(files.filter((file) => /^import /m.test(file.text))).toEqual([]);
});

/** The source files whose code matches a pattern. */
const naming = (pattern: RegExp): string[] =>
  SOURCE.filter((file) => pattern.test(file.text)).map((file) => file.path);

it('names each platform service in exactly one module, behind a port', () => {
  expect(naming(/\bcaches\./)).toEqual(['src/index.ts']);
  expect(naming(/\bconsole\./)).toEqual(['src/lib/logger.ts']);
  expect(naming(/\bnew Date\(|\bDate\.now\(/)).toEqual(['src/lib/clock.ts']);
  expect(naming(/\benv\.(AI|ASSETS|RATE_LIMITER)\b/)).toEqual(['src/index.ts']);
});
