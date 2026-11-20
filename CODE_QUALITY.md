# Code Quality

How the code is organised, the rules it is held to, and where each rule is
enforced. Everything on this page is checked by `npm run check`.

## SOLID, with the files that apply each principle

| Principle                 | How it is applied                                                                                                                                                                                                                                                                           | Files                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single responsibility** | Every module has one job, named in its opening comment. A strategy, a factor family, a screening rule, an adapter and a decorator each get their own file                                                                                                                                   | [strategies/](src/features/plan/strategies/), [impact/factors/](src/features/impact/factors/), [prompt-guard/rules/](src/lib/prompt-guard/rules/), [providers/](src/features/air-quality/providers/), [generators/](src/features/assistant/generators/)                                                                                                                                                                      |
| **Open/closed**           | New behaviour is added by adding a file and one list entry; the code that runs the list does not change. The planner test proves it by running a strategy the registry has never heard of                                                                                                   | [strategies/registry.ts](src/features/plan/strategies/registry.ts) and [planner.ts](src/features/plan/planner.ts); [rules/index.ts](src/lib/prompt-guard/rules/index.ts) and [scan.ts](src/lib/prompt-guard/scan.ts); [factors/index.ts](src/features/impact/factors/index.ts); the rule list in [app.ts](src/app.ts) and [admission.ts](src/middleware/admission.ts); [planner.test.ts](test/features/plan/planner.test.ts) |
| **Liskov substitution**   | Live, cached, fallback and offline providers all honour `AirQualityProvider`; model, cached, fallback and rule-based generators all honour `PlanGenerator`. One contract test runs over every implementation, and the test doubles are plain objects typed by the same ports, with no casts | [providers/substitutable.test.ts](test/features/air-quality/providers/substitutable.test.ts), [generators/substitutable.test.ts](test/features/assistant/generators/substitutable.test.ts), [test/support/fakes.ts](test/support/fakes.ts)                                                                                                                                                                                   |
| **Interface segregation** | Ports are the narrowest shape their caller uses: `Clock` has one method, `Cache` two, `Geocoder` one. Routes receive only the sources and gate they need, never the whole dependency set, and the Worker's bindings are declared as three narrow interfaces rather than the generated `Env` | [lib/ports.ts](src/lib/ports.ts), [air-quality/types.ts](src/features/air-quality/types.ts), [assistant/types.ts](src/features/assistant/types.ts), [plan/routes.ts](src/features/plan/routes.ts), `Bindings` in [index.ts](src/index.ts)                                                                                                                                                                                    |
| **Dependency inversion**  | Features depend on ports, and adapters implement them. A single composition root chooses the adapters and stacks the decorators. A test asserts that `caches`, `console`, `Date` and the bindings are each named in exactly one module                                                      | [index.ts](src/index.ts), [lib/cache.ts](src/lib/cache.ts), [lib/clock.ts](src/lib/clock.ts), [lib/logger.ts](src/lib/logger.ts), [assistant/workers-ai.ts](src/features/assistant/workers-ai.ts), [layers.dom.test.ts](test/conventions/layers.dom.test.ts)                                                                                                                                                                 |

## Layers

A module may import its own unit or a lower layer, never sideways or upwards.

| Height | Unit                                              | May import                               |
| ------ | ------------------------------------------------- | ---------------------------------------- |
| 0      | `src/config`                                      | nothing in `src`                         |
| 1      | `src/lib`                                         | config                                   |
| 2      | `src/middleware`                                  | lib, config                              |
| 3      | `src/features/air-quality`, `src/features/impact` | middleware, lib, config (not each other) |
| 4      | `src/features/plan`                               | air-quality, impact and below            |
| 5      | `src/features/assistant`                          | plan and below                           |
| 6      | `src/app.ts`                                      | features and below                       |
| 7      | `src/index.ts`                                    | everything                               |

[layers.dom.test.ts](test/conventions/layers.dom.test.ts) parses every import in
`src/` and fails on a violation.

## Limits enforced by lint

From [eslint.config.js](eslint.config.js), applied to source, front end, tests
and scripts alike, with zero warnings allowed:

| Rule                                       | Limit                                                 |
| ------------------------------------------ | ----------------------------------------------------- |
| `max-lines`                                | 110 lines per file, blank lines and comments excluded |
| `max-lines-per-function`                   | 30 lines                                              |
| `complexity`                               | cyclomatic complexity 8                               |
| `max-depth`                                | 3                                                     |
| `max-params`                               | 3                                                     |
| `consistent-type-assertions`               | no `as` casts (only `as const`)                       |
| `no-explicit-any`, `no-non-null-assertion` | forbidden                                             |
| `noInlineConfig`                           | no `eslint-disable` comments anywhere                 |
| `no-console`                               | forbidden outside [lib/logger.ts](src/lib/logger.ts)  |
| `no-warning-comments`                      | no TODO, FIXME, XXX or HACK                           |

TypeScript runs in strict mode with `noUncheckedIndexedAccess`, `noUnusedLocals`
and `noUnusedParameters` ([tsconfig.json](tsconfig.json)). The typescript-eslint
strict type-checked rule set is on for every file.

## Conventions enforced by tests

[files.dom.test.ts](test/conventions/files.dom.test.ts) reads the repository and
fails unless:

- every TypeScript file and front-end module opens with a comment saying what
  its one job is;
- every export of the Worker, the front end and the test support modules has a
  doc comment;
- every source module is under 3.5 KB, every test file under 4 KB and every
  stylesheet under 4 KB (the largest source module today is 3,473 bytes, the
  median 1,360).

## One source of truth

The form's options, labels, ranges and messages are defined once in
[src/config/](src/config/) and compiled for the page by
[scripts/build-assets.mjs](scripts/build-assets.mjs), so the page and the Worker
cannot disagree. The security headers for static assets are generated from
[security-policy.ts](src/config/security-policy.ts), the same data the Worker
applies. [form-setup.dom.test.ts](test/public/form-setup.dom.test.ts) and
[security-policy.test.ts](test/config/security-policy.test.ts) check both.

## Front end

Twelve ES modules in [public/js/](public/js/), one responsibility each, held to
the same lint limits and type-checked through JSDoc
([tsconfig.app.json](tsconfig.app.json)). Data from the server is narrowed by
runtime guards ([guards.js](public/js/guards.js)), never asserted.
