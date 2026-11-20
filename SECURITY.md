# Security

What the service protects, what it assumes, and where each control lives.

## Threat model

Saaf Saans has no accounts and no database, and one optional secret. What an
attacker can reach is: the two POST routes, the text they carry to a language
model, the replies of two upstream APIs, and the page that renders the result.
The assets worth protecting are a visitor's profile (family make-up, health,
location), the integrity of the advice and its numbers, the Workers AI quota
and, when it is configured, the NVIDIA key.

## 1. The request gate

Every POST passes these rules in order, cheapest first
([middleware/admission-rules.ts](src/middleware/admission-rules.ts),
[middleware/rate-limit.ts](src/middleware/rate-limit.ts), listed in
[app.ts](src/app.ts)):

| Rule                                                                                               | Refusal | Why                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content-type` must be `application/json`                                                          | 415     | The CSRF control: a cross-origin page cannot send JSON without a preflight, and no CORS policy exists for a preflight to pass                                                                                                 |
| `Sec-Fetch-Site`, when sent, must be `same-origin` or `none`                                       | 403     | Browsers set it and page script cannot forge it                                                                                                                                                                               |
| `Origin`, when sent, must equal the origin of the request's own URL; the literal `null` is refused | 403     | The same check for clients that send `Origin` without `Sec-Fetch-Site`. A request with neither header is admitted: it comes from a non-browser client, which holds no ambient authority, since the service has no credentials |
| A declared `content-length` over 4,096 bytes is refused before the body is read                    | 413     | A profile is under 1 KB                                                                                                                                                                                                       |
| 30 requests a minute per connecting address                                                        | 429     | Protects the model quota; runs last so a refused request never spends the budget                                                                                                                                              |

The size limit does not rest on the header alone. The body is read through a
byte counter ([middleware/validate.ts](src/middleware/validate.ts)) that fails
with the same 413 and cancels the stream as soon as more than 4,096 bytes have
arrived, so a body sent without a `content-length` is bounded too, and the limit
is in bytes, not characters.

## 2. Validation

[plan/schemas.ts](src/features/plan/schemas.ts) is the only way a profile enters
the system. It is a strict zod schema: unknown keys are rejected, every number
has a range, every choice is an enum, text is trimmed and capped (place 80
characters, notes 300). [middleware/validate.ts](src/middleware/validate.ts)
reports every issue against its field. Replies from Open-Meteo and values read
back from the cache are parsed against schemas too
([open-meteo-schemas.ts](src/features/air-quality/providers/open-meteo-schemas.ts),
[air-quality/schemas.ts](src/features/air-quality/schemas.ts),
[lib/remember.ts](src/lib/remember.ts)).

## 3. The model boundary

Text going in ([lib/prompt-guard/](src/lib/prompt-guard/)):

1. **Screen.** Seven rules look for text aimed at a machine: instruction
   overrides, role hijacks, steering about the air, suppression, prompt
   exfiltration, control tokens and hidden characters. Findings are shown to the
   visitor. The screen is plain code, because a screen implemented by a model
   can itself be argued with. Its patterns use bounded quantifiers, and a test
   feeds it adversarial input under a time limit.
2. **Strip.** Every sentence holding a match is removed before the prompt is
   built.
3. **Fence.** What is left, and the place name returned by the geocoder (also
   third-party text), is wrapped in a delimiter made from a fresh random UUID,
   with chat control tokens defanged. The system prompt says fenced text is
   data.

Text coming out
([assistant/reply-checks.ts](src/features/assistant/reply-checks.ts),
[assistant/reply-issues.ts](src/features/assistant/reply-issues.ts)):

1. The reply must be one complete JSON object matching a strict schema.
2. It must explain every recommendation exactly once and nothing else.
3. **Number firewall**: every numeral in it must appear in the computed facts or
   the visitor's own notes. A reply that invents a statistic is rejected.
4. The summary, every explanation and the closing line must each end as a
   sentence does (`.`, `!` or `?`, optionally followed by a closing quote or
   bracket), so text cut off at a length limit is never shown.
5. No text may have a gap where a word was dropped (two spaces inside a
   sentence), which is how a missing figure shows up in a model's reply.
6. In air worse than moderate, no text may say that nobody is at risk or that
   the air is safe: that contradicts the health advice in the facts
   ([risk-claims.ts](src/features/assistant/risk-claims.ts)).

The firewall reads numerals written in digits. It cannot tell whether a figure
that is in the facts has been attached to the right thing, which is why the
engine's own impact line is always shown beside the model's wording, and why the
prompt tells the model not to repeat it.

A rejected reply is never shown. A second model is asked once: with the reasons
for the rejection when the first reply failed these checks, with the original
request when the first call failed or timed out. If that attempt fails too, the
rule-based generator answers; there is no third model call. The client never
tells the model what the air or the numbers are: the brief is rebuilt
server-side from the validated profile on every request.

## 4. The page

- **Content Security Policy**
  ([config/security-policy.ts](src/config/security-policy.ts)):
  `default-src 'self'`, `script-src 'self'`, `style-src 'self'`,
  `connect-src 'self'`, `object-src 'none'`, `base-uri 'none'`,
  `form-action 'none'`, `frame-ancestors 'none'`. No nonce or hash is needed,
  because the page has no inline script or style at all (a test asserts this).
- **Trusted Types**: `require-trusted-types-for 'script'` with
  `trusted-types 'none'` makes the browser refuse assignments to markup-parsing
  sinks such as `innerHTML`. The front end only ever sets text
  ([public/js/dom.js](public/js/dom.js)); a test renders a model reply
  containing markup and checks that it stays text.
- **Other headers**: HSTS with preload, `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, COOP, CORP and COEP, and a
  `Permissions-Policy` denying 22 features.
- Static assets are served at the edge without the Worker, so the same policy is
  written to `public/_headers` from the same data at build time, and a test
  checks the two are identical.

## 5. Privacy

- Profiles are not stored. API replies carry `cache-control: no-store`.
- The narrative cache is keyed by a SHA-256 hash of the brief
  ([lib/content-key.ts](src/lib/content-key.ts)), so a key reveals nothing and
  one household cannot read another's narrative.
- Open-Meteo receives a place name and coordinates rounded to three decimals,
  nothing else.
- Logs carry an event name, the model's name and why an attempt failed: an
  error's message, or the checks a reply did not pass (which can quote an id, a
  key or a numeral the model wrote). No log call is given the profile, the notes
  or the prompt.
- An unexpected fault is answered with a generic 500 and no detail.
- When the NVIDIA key is configured, the request that would have gone to Workers
  AI (the same computed facts and the same screened, fenced notes) goes to
  NVIDIA's API at `integrate.api.nvidia.com` first. Nothing else is sent to
  NVIDIA. The Calendar reminder is a link the visitor chooses to open, and the
  page loads nothing from Google.

## 6. Supply chain and CI

- One secret can exist, and it is optional: `NVIDIA_API_KEY`, set with
  `wrangler secret put`. It lives only in the Worker's secret store: in no file
  of this repository, not in CI and not in the bundle. It is sent only in the
  `Authorization` header to `integrate.api.nvidia.com`, never in a URL, a log
  line or a reply; a failed call logs the HTTP status, or the transport error
  with the key removed ([nvidia.ts](src/features/assistant/nvidia.ts),
  [nvidia-key.test.ts](test/features/assistant/nvidia-key.test.ts)). Without it
  nothing here needs a key: inference is a Workers AI binding and the air data
  API is keyless. A CI job fails if a credential-shaped string is committed,
  including one shaped like an NVIDIA key.
- `npm audit` reports 0 vulnerabilities, and CI fails on any advisory at any
  severity, dev dependencies included.
- Every GitHub Action is pinned to a commit SHA; Dependabot keeps the pins and
  the packages current; CodeQL runs the `security-extended` queries; pull
  requests get a dependency review.

## 7. Reporting

Please report a vulnerability through
<https://github.com/uditjainstjis/saaf-saans/security/advisories/new>. Do not
include real personal details in a report.
[/.well-known/security.txt](public/.well-known/security.txt) carries the same
contact.

## What this service deliberately does not do

- It does not authenticate anyone, so it holds no session to steal.
- It does not render model output as HTML.
- It does not send a visitor's notes anywhere except, screened and fenced, to
  the model.
