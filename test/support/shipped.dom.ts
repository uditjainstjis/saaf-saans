/**
 * The files the page is actually served, read off disk: the markup and the
 * stylesheets it links, in load order. Tests of markup and CSS start here.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PUBLIC = resolve(process.cwd(), 'public');

/** A shipped file, read off disk. */
export const shipped = (name: string): string => readFileSync(resolve(PUBLIC, name), 'utf8');

/** The stylesheets index.html links, in load order: read from the markup, so the list cannot drift. */
export const STYLESHEETS: readonly string[] = [
  ...shipped('index.html').matchAll(/<link rel="stylesheet" href="\/(css\/[a-z-]+\.css)"/g),
].map((match) => match[1] ?? '');

/** The whole shipped stylesheet. */
export const css = (): string => STYLESHEETS.map(shipped).join('\n');
