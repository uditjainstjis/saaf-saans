/**
 * Content-addressed cache keys: a hash of the inputs that fully determine a
 * value, so a key reveals nothing about a household. Used with ./cache.ts.
 */

/** SHA-256 of `parts`, as lowercase hex. */
export async function contentKey(parts: readonly string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join('\u0000'));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
