/**
 * Fencing of untrusted text inside a prompt: control tokens are defanged and
 * the text is wrapped in a delimiter it cannot guess, so it can never close
 * the data section and start issuing instructions. Screening is ./scan.ts.
 */

/** Wrap untrusted text in a per-request delimiter, with chat control tokens neutralised. */
export function fenceUntrusted(text: string, nonce: string): string {
  const defanged = text
    .replace(/<\|/g, '<​|')
    .replace(/\|>/g, '|​>')
    // Each [INST] or [/INST] gets a zero-width space after its bracket.
    .replace(/\[(\/?)INST\]/gi, '[​$1INST]')
    // A literal split, so none of the nonce is ever read as pattern syntax.
    .split(nonce)
    .join('');
  return `<<<${nonce}\n${defanged}\n${nonce}>>>`;
}

/** An unguessable delimiter for {@link fenceUntrusted}: 122 random bits as 32 hex digits. */
export function makeNonce(): string {
  return `SAAF_${crypto.randomUUID().replace(/-/g, '')}`;
}
