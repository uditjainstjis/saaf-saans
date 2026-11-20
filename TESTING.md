# Testing

## Result

`npm run check` runs the type checker, the linter, the format check and every
test with coverage. On the committed tree:

```text
 Test Files  89 passed (89)
      Tests  415 passed (415)

Statements   : 100% ( 901/901 )
Branches     : 100% ( 308/308 )
Functions    : 100% ( 274/274 )
Lines        : 100% ( 794/794 )
```

| Directory                            | Statements | Branches | Functions | Lines |
| ------------------------------------ | ---------- | -------- | --------- | ----- |
| All files                            | 100        | 100      | 100       | 100   |
| `public/js`                          | 100        | 100      | 100       | 100   |
| `src`                                | 100        | 100      | 100       | 100   |
| `src/config`                         | 100        | 100      | 100       | 100   |
| `src/features/air-quality`           | 100        | 100      | 100       | 100   |
| `src/features/air-quality/providers` | 100        | 100      | 100       | 100   |
| `src/features/assistant`             | 100        | 100      | 100       | 100   |
| `src/features/assistant/generators`  | 100        | 100      | 100       | 100   |
| `src/features/impact`                | 100        | 100      | 100       | 100   |
| `src/features/impact/factors`        | 100        | 100      | 100       | 100   |
| `src/features/plan`                  | 100        | 100      | 100       | 100   |
| `src/features/plan/strategies`       | 100        | 100      | 100       | 100   |
| `src/lib`                            | 100        | 100      | 100       | 100   |
| `src/lib/prompt-guard`               | 100        | 100      | 100       | 100   |
| `src/lib/prompt-guard/rules`         | 100        | 100      | 100       | 100   |
| `src/middleware`                     | 100        | 100      | 100       | 100   |

Coverage is measured over every module in `src/` and `public/js/` and gated at
100% for statements, branches, functions and lines in
[vitest.config.ts](vitest.config.ts): below that, the command fails.

## How the suite is built

Two Vitest projects, because the code runs in two places.

| Project   | Runtime                                            | What runs there                                                                            |
| --------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `workers` | workerd, through `@cloudflare/vitest-pool-workers` | Everything in `src/`: the same Cache API, `crypto`, `Request` and `Response` as production |
| `dom`     | jsdom on Node                                      | The front-end modules, axe-core, contrast, and checks that read shipped files from disk    |

The suite is hermetic. Every dependency on the outside world is a port, so tests
inject plain objects typed by those ports
([test/support/fakes.ts](test/support/fakes.ts),
[assistant-fakes.ts](test/support/assistant-fakes.ts)). Vitest's `vi` is used
only to stand in for browser and platform globals (`fetch`, `localStorage`,
`console`). No test uses a type cast or touches the network. Tests mirror the
source tree: the test for `src/features/plan/strategies/seal-gaps.ts` is
`test/features/plan/strategies/seal-gaps.test.ts`.

## Layers

| Layer         | What it proves                                                                                                                              | Examples                                                                                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | Each formula, strategy, rule and adapter on its own. Expected figures are worked out by hand in a comment beside each assertion             | [impact/service.test.ts](test/features/impact/service.test.ts), [strategies/](test/features/plan/strategies/), [factors.test.ts](test/features/impact/factors.test.ts)                                                                                                                             |
| Contract      | Every implementation of a port honours the same contract                                                                                    | [providers/substitutable.test.ts](test/features/air-quality/providers/substitutable.test.ts), [generators/substitutable.test.ts](test/features/assistant/generators/substitutable.test.ts)                                                                                                         |
| Integration   | Routes through the real application with fake dependencies; the composition root inside workerd with only the network and bindings replaced | [plan/routes.test.ts](test/features/plan/routes.test.ts), [assistant/routes.test.ts](test/features/assistant/routes.test.ts), [index.test.ts](test/index.test.ts)                                                                                                                                  |
| Security      | The admission gate, the capped body read, validation, the injection screen, the reply checks, headers, and model text rendered as text      | [test/middleware/](test/middleware/), [test/lib/prompt-guard/](test/lib/prompt-guard/), [reply-checks.test.ts](test/features/assistant/reply-checks.test.ts), [reply-issues.test.ts](test/features/assistant/reply-issues.test.ts), [security-policy.test.ts](test/config/security-policy.test.ts) |
| Front end     | The real `index.html` and the real modules in jsdom: form, errors, rendering, theme                                                         | [test/public/](test/public/)                                                                                                                                                                                                                                                                       |
| Accessibility | axe-core over five rendered states in both themes, computed contrast for every colour pair, structural WCAG checks                          | [test/a11y/](test/a11y/)                                                                                                                                                                                                                                                                           |
| Conventions   | File headers, documented exports, size limits and the layer rules                                                                           | [test/conventions/](test/conventions/)                                                                                                                                                                                                                                                             |

Two guards keep the gates honest: the axe suite includes a negative control that
must find violations in a deliberately broken page, and the contrast arithmetic
is checked against published ratios before it is trusted.

## Failure paths that are tested

- Open-Meteo down, slow, answering an error, or answering a malformed body.
- The first model down, hanging, replying with prose, with the wrong ids, with
  an invented number, with a sentence cut short or with a word dropped; the
  second model answering after a failure (given the original request) and after
  a rejection (given the reasons); both failing, and never a third call.
- A cache that throws on read and on write, and a cached value of a stale shape.
- Every refusal the API can give (400, 403, 404, 413, 415, 429) and an
  unexpected fault (500 without detail).
- A foreign or `null` `Origin`; a body with no declared length that never ends;
  a body over the limit in bytes though not in characters.
- In the page: an invalid form, refusals from the Worker, a reply that is not
  JSON, a reply it cannot render, the network down, the assistant failing while
  the plan stays on screen, and storage being unavailable.

## Measured outside the suite

The suite never touches the network, so the deployed behaviour was checked
separately. Each check below states its conditions.

### On Cloudflare

20 Nov 2026, measured with curl from India against the deployed service, with
the shipped deadlines. The six profiles are families in Delhi, Mumbai, Kanpur
and Patna, a school in Lucknow and a residents' association in Gurugram.

| Call                                                                            | Result                                                                                                                                           |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/plan` for the six profiles                                           | 200 with live air on all six; 0.8 to 0.9 s                                                                                                       |
| `POST /api/assistant` for the six profiles                                      | `source: model` on all six, each written by the first model on its first attempt; 8.2 to 11.4 s including the plan rebuild                       |
| The same six on the build before the last fix                                   | Five written by the first model; for one, its reply was rejected by the number check and the second model answered, `source: model` after 17.0 s |
| A valid body with a foreign `Origin`, with `Origin: null`, and with no `Origin` | 403, 403 and 200                                                                                                                                 |
| Lighthouse 13.6.0, Chrome 158, on the live page                                 | Desktop: 100 in all four categories. Mobile: 100 for accessibility, best practices and SEO; performance 97, 100 and 100 over three runs          |

The rule-written fallback was not needed in any of these calls.

### By hand, on the development machine

`wrangler dev` on the unmodified code, 20 Nov 2026.

| Check                                                                                             | Result   |
| ------------------------------------------------------------------------------------------------- | -------- |
| A request with neither `Origin` nor `Sec-Fetch-Site`; a request carrying the service's own origin | 200      |
| A foreign `Origin`; `Origin: null`; `Sec-Fetch-Site: cross-site`                                  | 403      |
| `content-type: text/plain`                                                                        | 415      |
| A 6 KB body with a declared length; the same body sent chunked, with no length                    | 413      |
| An invalid profile; a place that does not exist                                                   | 400; 404 |

The page was also driven in headless Chrome 158 at 390 px and 320 px: its own
requests carried the page's origin and `Sec-Fetch-Site: same-origin` and were
admitted, and the console stayed empty. [ACCESSIBILITY.md](ACCESSIBILITY.md)
lists what that run showed about focus, names and layout.

This machine's network adds about six seconds to every outbound call from local
workerd. On it the Open-Meteo calls pass their four-second deadline, so the air
shown is the labelled typical values; and in one run the first model's call
passed its 15 s deadline, the second model answered, and the route returned
model-written text after 30 s. That is the only time the second model was seen
answering outside the suite, and it says nothing about latency on Cloudflare.

## Commands

```bash
npm run check        # the whole gate
npm test             # tests with coverage only
npm run test:watch   # watch mode
```
