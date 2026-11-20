/**
 * Tests for the response policy as data: what the Worker sets and what
 * public/_headers states for static assets are the same thing.
 */
import { expect, it } from 'vitest';
import { headersFile } from '../../src/config/security-policy';
import { harden } from '../../src/middleware/security-headers';

/** headersFile() read back as path → header name → value. */
function rules(): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>();
  for (const block of headersFile().trim().split('\n\n')) {
    const [path = '', ...lines] = block.split('\n');
    const pairs = lines.map((line) => /^ {2}([a-z-]+): (.+)$/.exec(line));
    out.set(path, new Map(pairs.map((m) => [m?.[1] ?? '', m?.[2] ?? ''])));
  }
  return out;
}

const policy = (): Map<string, string> => new Map(harden(new Response()).headers);

it('reaches static assets as exactly the headers the Worker sets', () => {
  expect(rules().get('/*')).toEqual(policy());
  expect(policy().size).toBe(11);
});

it('adds rules for the icon and security.txt only, leaving scripts and styles to revalidate', () => {
  expect([...rules().keys()]).toEqual(['/*', '/favicon.svg', '/.well-known/*']);
  expect(rules().get('/favicon.svg')?.get('cache-control')).toBe('public, max-age=86400');
  expect(rules().get('/.well-known/*')?.get('content-type')).toMatch(/^text\/plain/);
});

it('ships a content security policy with no unsafe escape hatches', () => {
  const csp = policy().get('content-security-policy') ?? '';
  expect(csp).not.toContain('unsafe-inline');
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("connect-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("require-trusted-types-for 'script'");
});

it('sets transport, framing, sniffing, referrer and isolation headers', () => {
  const headers = policy();
  expect(headers.get('strict-transport-security')).toContain('max-age=31536000');
  expect(headers.get('x-content-type-options')).toBe('nosniff');
  expect(headers.get('x-frame-options')).toBe('DENY');
  expect(headers.get('referrer-policy')).toBe('no-referrer');
  expect(headers.get('cross-origin-opener-policy')).toBe('same-origin');
  expect(headers.get('permissions-policy')).toContain('geolocation=()');
});
