/**
 * Cross-cutting ports: the platform services every feature may need, each as
 * the narrowest interface its callers use. Production adapters sit beside this
 * file; feature-specific ports are in each feature's types.ts. Wired in src/index.ts.
 */

/** The time. Injected so that code depending on "now" is testable. */
export interface Clock {
  now(): Date;
}

/** A key-value cache with expiry. A miss and a failure both read as undefined. */
export interface Cache {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}

/** An HTTP GET: as much of `fetch` as the upstream adapters use. */
export type HttpGet = (url: string, signal: AbortSignal) => Promise<Response>;

/** What an {@link HttpPost} sends: headers, a JSON body already serialised, and the abort signal. */
export interface PostInit {
  headers: Readonly<Record<string, string>>;
  body: string;
  signal: AbortSignal;
}

/** An HTTP POST: as much of `fetch` as the NVIDIA adapter uses. */
export type HttpPost = (url: string, init: PostInit) => Promise<Response>;

/** Structured diagnostics: `info` for what happened, `warn` for what went wrong. */
export interface Logger {
  info(event: string, detail: Readonly<Record<string, unknown>>): void;
  warn(event: string, detail: Readonly<Record<string, unknown>>): void;
}

/** Serves the static single-page app. */
export interface AssetServer {
  fetch(request: Request): Promise<Response>;
}
