/**
 * Writes the files in public/ that are generated from src/config, so the page,
 * the edge and the Worker share one definition: the compiled options, limits
 * and labels (with their declarations) and public/_headers. Outputs are
 * gitignored; `npm run generate` and wrangler's build step run this script.
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

/** Write `body` to `path` under a line (in `comment` syntax) naming its source. */
function emit({ path, source, body, comment = '//' }) {
  const banner = `${comment} Generated from ${source} by scripts/build-assets.mjs. Edit that file, not this one.\n`;
  writeFileSync(new URL(path, root), banner + body);
}

const read = (path) => readFileSync(new URL(path, root), 'utf8');
const compile = (path) => text(path, ts.transpileModule(read(path), { compilerOptions }));
const declare = (path) => text(path, ts.transpileDeclaration(read(path), { compilerOptions }));

// Each of these imports nothing, so its compiled copy stands alone in the page.
mkdirSync(new URL('public/js/shared/', root), { recursive: true });
for (const name of ['options', 'limits', 'labels']) {
  const source = `src/config/${name}.ts`;
  emit({ path: `public/js/shared/${name}.js`, source, body: compile(source) });
  emit({ path: `public/js/shared/${name}.d.ts`, source, body: declare(source) });
}

// security-policy.ts imports nothing, so its compiled text runs as a module on its own.
const POLICY = 'src/config/security-policy.ts';
const { headersFile } = await import(`data:text/javascript,${encodeURIComponent(compile(POLICY))}`);
emit({ path: 'public/_headers', source: POLICY, body: headersFile(), comment: '#' });
