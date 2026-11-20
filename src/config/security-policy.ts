/**
 * The response policy as data: security headers for every reply and cache
 * rules for static paths. It imports nothing, because scripts/build-assets.mjs
 * evaluates it to write public/_headers. Applied by middleware/security-headers.ts.
 */

/** Scripts and styles come only from this origin; DOM sinks that parse markup are closed. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'none'",
  "connect-src 'self'",
  "media-src 'none'",
  "worker-src 'none'",
  "manifest-src 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "require-trusted-types-for 'script'",
  "trusted-types 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** Browser features the page never uses; each is denied with an empty allowlist. */
const DENIED_FEATURES =
  'accelerometer autoplay bluetooth camera display-capture encrypted-media gamepad geolocation ' +
  'gyroscope hid idle-detection local-fonts magnetometer microphone midi payment ' +
  'picture-in-picture publickey-credentials-get screen-wake-lock serial usb xr-spatial-tracking';

type HeaderMap = Readonly<Record<string, string>>;

/** The headers set on every response, API and static alike. */
export const SECURITY_HEADERS: HeaderMap = {
  'content-security-policy': CSP,
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'permissions-policy': DENIED_FEATURES.split(' ')
    .map((feature) => `${feature}=()`)
    .join(', '),
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'cross-origin-embedder-policy': 'require-corp',
  'x-permitted-cross-domain-policies': 'none',
  'origin-agent-cluster': '?1',
};

/**
 * Extra headers for static paths. Styles and scripts keep the platform default
 * (revalidated with an ETag on every load), so a deploy is never mixed with
 * stale code; the icon is cached for a day and security.txt is plain text.
 */
const STATIC_RULES: Readonly<Record<string, HeaderMap>> = {
  '/favicon.svg': { 'cache-control': 'public, max-age=86400' },
  '/.well-known/*': {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=3600',
  },
};

/** The text of public/_headers: the policy on every path, then the static rules. */
export function headersFile(): string {
  const rules = { '/*': SECURITY_HEADERS, ...STATIC_RULES };
  const block = ([path, headers]: [string, HeaderMap]): string =>
    [path, ...Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`)].join('\n');
  return `${Object.entries(rules).map(block).join('\n\n')}\n`;
}
