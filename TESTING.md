# Testing

## Result

`npm run check` runs the type checker, the linter, the format check and every
test with coverage. On the committed tree:

```text
 Test Files  86 passed (86)
      Tests  378 passed (378)

Statements   : 100% ( 855/855 )
Branches     : 100% ( 295/295 )
Functions    : 100% ( 260/260 )
Lines        : 100% ( 751/751 )
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

| Layer         | What it proves                                                                                                                              | Examples                                                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | Each formula, strategy, rule and adapter on its own. Expected figures are worked out by hand in a comment beside each assertion             | [impact/service.test.ts](test/features/impact/service.test.ts), [strategies/](test/features/plan/strategies/), [factors.test.ts](test/features/impact/factors.test.ts)                                                       |
| Contract      | Every implementation of a port honours the same contract                                                                                    | [providers/substitutable.test.ts](test/features/air-quality/providers/substitutable.test.ts), [generators/substitutable.test.ts](test/features/assistant/generators/substitutable.test.ts)                                   |
| Integration   | Routes through the real application with fake dependencies; the composition root inside workerd with only the network and bindings replaced | [plan/routes.test.ts](test/features/plan/routes.test.ts), [assistant/routes.test.ts](test/features/assistant/routes.test.ts), [index.test.ts](test/index.test.ts)                                                            |
| Security      | The admission gate, validation, the injection screen, the number firewall, headers, and model text rendered as text                         | [test/middleware/](test/middleware/), [test/lib/prompt-guard/](test/lib/prompt-guard/), [reply-checks.test.ts](test/features/assistant/reply-checks.test.ts), [security-policy.test.ts](test/config/security-policy.test.ts) |
| Front end     | The real `index.html` and the real modules in jsdom: form, errors, rendering, theme                                                         | [test/public/](test/public/)                                                                                                                                                                                                 |
| Accessibility | axe-core over five rendered states in both themes, computed contrast for every colour pair, structural WCAG checks                          | [test/a11y/](test/a11y/)                                                                                                                                                                                                     |
| Conventions   | File headers, documented exports, size limits and the layer rules                                                                           | [test/conventions/](test/conventions/)                                                                                                                                                                                       |

Two guards keep the gates honest: the axe suite includes a negative control that
must find violations in a deliberately broken page, and the contrast arithmetic
is checked against published ratios before it is trusted.

## Failure paths that are tested

- Open-Meteo down, slow, answering an error, or answering a malformed body.
- The model down, hanging, replying with prose, with the wrong ids, or with an
  invented number; rejected once and repaired; rejected twice.
- A cache that throws on read and on write, and a cached value of a stale shape.
- Every refusal the API can give (400, 403, 404, 413, 415, 429) and an
  unexpected fault (500 without detail).
- In the page: an invalid form, refusals from the Worker, a reply that is not
  JSON, a reply it cannot render, the network down, the assistant failing while
  the plan stays on screen, and storage being unavailable.

## End-to-end run

On 2026-11-20 the application was run with `wrangler dev` against the live
Open-Meteo APIs and the real Workers AI binding, from a clone of the repository:

| Scenario                                                        | Result                                                                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Family in Delhi, live air, model available                      | Air `live`, US AQI 191 "Unhealthy"; six recommendations; narrative `source: model`, quoting only computed figures |
| School of 600 in Lucknow with an injection attempt in the notes | Air `live`; seven recommendations; two findings reported; narrative `source: model`                               |
| Same routes with the model deadline forced to expire            | Air `live`; narrative `source: rules`                                                                             |
| Upstream calls timing out at the shipped four-second deadline   | Air `typical`, labelled as such; narrative `source: rules`                                                        |
| Refusals by hand                                                | 415 for `text/plain`, 403 for a cross-site request, 400 listing every invalid field, 404 for an unknown place     |

The development machine's network drops IPv6, which makes each outbound call
from local workerd take about six seconds. The first three rows were therefore
run with the two deadlines raised in the clone only; the fourth is the
unmodified code on that network.

## Commands

```bash
npm run check        # the whole gate
npm test             # tests with coverage only
npm run test:watch   # watch mode
```
