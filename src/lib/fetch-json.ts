/**
 * One JSON GET against an upstream API, under a deadline. The reply is
 * returned unparsed-by-shape: callers validate it against their own schema.
 * Used by the Open-Meteo adapters in features/air-quality/providers/.
 */

import type { HttpGet } from './ports';
import { withTimeout } from './timeout';

/** A successful reply's JSON, or a rejection naming the status or the timeout. */
export async function fetchJson(get: HttpGet, url: string, timeoutMs: number): Promise<unknown> {
  const res = await withTimeout((signal) => get(url, signal), timeoutMs);
  if (!res.ok) throw new Error(`upstream answered ${res.status}`);
  return res.json();
}
