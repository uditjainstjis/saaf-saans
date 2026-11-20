/**
 * The Worker's bindings, as `wrangler types` generates them from wrangler.jsonc
 * (npm run generate), so the type cannot drift from the deployed configuration.
 * The narrow shape the code actually uses is `Bindings` in src/index.ts.
 */

/** The generated binding types. */
export type Env = Cloudflare.Env;
