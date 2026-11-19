/**
 * Writes the files in public/ that are generated from TypeScript in src/, so
 * the page, the edge and the Worker share one definition of each:
 *
 *   public/js/shared/constants.js    src/shared/constants.ts, compiled
 *   public/js/shared/constants.d.ts  its declarations, which type the front end
 *   public/_headers                  headersFile() from src/security/headers.ts
 *
 * Generated files are gitignored. `npm run generate` runs this script, and
 * wrangler runs it as build.command before `dev` and `deploy`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const compilerOptions = { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 };

/** The output text of a TypeScript transform, or an error naming why it failed. */
function text(source, { outputText, diagnostics = [] }) {
  if (diagnostics.length === 0) return outputText;
  const why = diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' '));
  throw new Error(`${source}: ${why.join('; ')}`);
}

/** Write `body` to `path` under a `comment`-style line naming its source. */
function emit(path, source, body, comment = '//') {
  const banner = `${comment} Generated from ${source} by scripts/build-assets.mjs. Edit that file, not this one.\n`;
  writeFileSync(new URL(path, root), banner + body);
}

const read = (path) => readFileSync(new URL(path, root), 'utf8');
const compile = (path) => text(path, ts.transpileModule(read(path), { compilerOptions }));
const declare = (path) => text(path, ts.transpileDeclaration(read(path), { compilerOptions }));

// constants.ts imports nothing, so its compiled copy stands alone in the page.
const CONSTANTS = 'src/shared/constants.ts';
mkdirSync(new URL('public/js/shared/', root), { recursive: true });
emit('public/js/shared/constants.js', CONSTANTS, compile(CONSTANTS));
emit('public/js/shared/constants.d.ts', CONSTANTS, declare(CONSTANTS));

// headers.ts imports nothing, so its compiled text runs as a module on its own.
const HEADERS = 'src/security/headers.ts';
const { headersFile } = await import(
  `data:text/javascript,${encodeURIComponent(compile(HEADERS))}`
);
emit('public/_headers', HEADERS, headersFile(), '#');
