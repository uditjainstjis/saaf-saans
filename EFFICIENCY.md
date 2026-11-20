# Efficiency

Where time and bytes go, and what was done about each. Sizes were measured on
the committed tree; none is an estimate.

## Request path

| Decision                                                                | Effect                                                                                                                               | Where                                                                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Static assets are served by the edge; the Worker runs only for `/api/*` | A page view costs no Worker invocation                                                                                               | `run_worker_first` in [wrangler.jsonc](wrangler.jsonc)                                                                                         |
| Two routes, split by cost                                               | The air and the numbers render as soon as the deterministic route answers; the model's wording arrives later and fills in            | [plan/routes.ts](src/features/plan/routes.ts), [assistant/routes.ts](src/features/assistant/routes.ts), [public/js/main.js](public/js/main.js) |
| One application per isolate                                             | The router and the adapter stack are built on the first request and reused                                                           | the `WeakMap` in [index.ts](src/index.ts)                                                                                                      |
| Deadlines with cancellation                                             | An upstream call is abandoned after 4 s and a model call after 15 s, through an `AbortSignal`, so nothing waits on a hung dependency | [lib/timeout.ts](src/lib/timeout.ts), [config/runtime.ts](src/config/runtime.ts)                                                               |
| At most two model calls per request                                     | One attempt and one repair, 900 output tokens each                                                                                   | [assistant/service.ts](src/features/assistant/service.ts)                                                                                      |

## Caching

All three caches use the Workers Cache API, which needs no binding and expires
entries itself ([lib/cache.ts](src/lib/cache.ts),
[lib/remember.ts](src/lib/remember.ts)).

| What                           | Key                                                     | Lifetime                                                |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------- |
| Place lookups, misses included | the lower-cased query                                   | 24 hours                                                |
| Air reports                    | coordinates rounded to two decimals (about a kilometre) | 10 minutes                                              |
| Model narratives               | SHA-256 of the brief                                    | 10 minutes                                              |
| Stylesheets and scripts        | path                                                    | 10 minutes fresh, then stale-while-revalidate for a day |

A neighbourhood checking its air in the same ten minutes makes one upstream
call. Failures are never cached. API replies themselves are `no-store`, because
they describe one household.

## Payload

No framework, no web font, no image and no third-party request. Sizes below are
bytes on disk and after `gzip -9`.

| Asset                                     | Files  | Raw         | Gzip        |
| ----------------------------------------- | ------ | ----------- | ----------- |
| `index.html`                              | 1      | 13.8 KB     | 3.4 KB      |
| Stylesheets                               | 4      | 10.6 KB     | 3.7 KB      |
| Front-end modules                         | 11     | 23.1 KB     | 9.9 KB      |
| Shared modules compiled from `src/config` | 3      | 4.1 KB      | 2.2 KB      |
| **Total**                                 | **19** | **51.6 KB** | **19.1 KB** |

An `/api/plan` reply was 8.7 KB for a family and 10.4 KB for a community in the
end-to-end run, uncompressed; an `/api/assistant` reply was about 2 KB.

## Worker bundle

Bundled and minified with esbuild, the Worker is 160.0 KB (53.5 KB gzipped). It
was 502.6 KB (116.5 KB gzipped) until zod was imported as a namespace
(`import * as z from 'zod'`), which lets the bundler drop the locale files the
code never uses. Hono and zod are the only runtime dependencies.

## Computation

The impact engine is arithmetic over at most eleven strategies and 24 hourly
readings; it allocates a few small objects and does no I/O. The injection screen
runs seven regular expressions with bounded quantifiers over at most 380
characters of text.

## Checked by tests

- Upstream calls are made once per place and served from cache after
  ([cached.test.ts](test/features/air-quality/providers/cached.test.ts)).
- A model narrative is generated once per distinct brief
  ([generators/cached.test.ts](test/features/assistant/generators/cached.test.ts)).
- The composition root caches upstream calls end to end, inside workerd
  ([index.test.ts](test/index.test.ts)).
- The page loads one module script and four stylesheets, nothing inline and
  nothing third-party ([index.dom.test.ts](test/public/index.dom.test.ts)).
- A hung upstream or model call is cancelled at its deadline
  ([timeout.test.ts](test/lib/timeout.test.ts)).
