# Efficiency

Where time and bytes go, and what was done about each. Sizes were measured on
the committed tree; none is an estimate. Latency was measured on Cloudflare,
under the conditions stated beside the figures.

## Request path

| Decision                                                                | Effect                                                                                                                                                   | Where                                                                                                                                          |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Static assets are served by the edge; the Worker runs only for `/api/*` | A page view costs no Worker invocation                                                                                                                   | `run_worker_first` in [wrangler.jsonc](wrangler.jsonc)                                                                                         |
| Two routes, split by cost                                               | The air and the numbers render as soon as the deterministic route answers; the model's wording arrives later and fills in                                | [plan/routes.ts](src/features/plan/routes.ts), [assistant/routes.ts](src/features/assistant/routes.ts), [public/js/main.js](public/js/main.js) |
| One application per isolate                                             | The router and the adapter stack are built on the first request and reused                                                                               | the `WeakMap` in [index.ts](src/index.ts)                                                                                                      |
| Deadlines with cancellation                                             | An upstream call is abandoned after 4 s and a model call after 15 s, through an `AbortSignal`, so nothing waits on a hung dependency                     | [lib/timeout.ts](src/lib/timeout.ts), [config/runtime.ts](src/config/runtime.ts)                                                               |
| At most two model calls per request                                     | The first model, then the second only if the first fails or its reply is rejected; never a third call                                                    | [assistant/service.ts](src/features/assistant/service.ts)                                                                                      |
| Short replies                                                           | Output length is what a model call costs (see below), so the prompt asks for one sentence per recommendation and each call has a 600-token output budget | [assistant/prompt.ts](src/features/assistant/prompt.ts), [config/runtime.ts](src/config/runtime.ts)                                            |

## Model latency

With the NVIDIA key set, which is how the service is deployed, measured on
Cloudflare with the shipped deadlines on 20 Nov 2026, with curl from India, for
the six profiles named below:

| Route                                             | Wall time    |
| ------------------------------------------------- | ------------ |
| `POST /api/plan`                                  | 1.0 to 2.1 s |
| `POST /api/assistant`, including the plan rebuild | 4.8 to 5.4 s |

All six assistant calls returned `source: model`. The Worker's log named
`nvidia/nemotron-3.5-bolt-e4b` as the model that answered in the five calls
whose log lines were captured. On a preview of the same build, twelve of
thirteen calls took 4.3 to 6.3 s and one took 12.0 s; preview calls are not
logged, so which model answered that one is not known.

The figures below are for the Workers AI models alone, measured before the key
was set.

Measured on Cloudflare with the shipped deadlines on 20 Nov 2026, with curl from
India, for six profiles: families in Delhi, Mumbai, Kanpur and Patna, a school
in Lucknow and a residents' association in Gurugram, with six to eight
recommendations each.

| Route                                             | Wall time     |
| ------------------------------------------------- | ------------- |
| `POST /api/plan`                                  | 0.8 to 0.9 s  |
| `POST /api/assistant`, including the plan rebuild | 8.2 to 11.4 s |

All six assistant calls returned `source: model`, each written by the first
model on its first attempt; the Worker's log names the model that answered.

On the build before the last fix, five of the same six profiles took 8.2 to 10.6
s and one took 17.0 s: the first model wrote "PM 2.5" with a space, the number
check rejected the reply as carrying an invented figure, and the second model
answered with that reason in hand. Spaced pollutant names are now read as names
([number-firewall.ts](src/features/assistant/number-firewall.ts)).

Before these changes the route asked one model,
`@cf/meta/llama-3.3-70b-instruct-fp8-fast`, for up to 900 tokens, and the
deployed service answered after 15.9 s with `source: rules`: the model call had
passed its 15 s deadline. Timed alone on an instrumented copy (one call, 60 s
deadline), that model wrote 490 completion tokens in 14.0 s with schema mode and
501 in 15.8 s without it, so schema mode was not the cost; output length was.
Record 10 in [docs/decisions.md](docs/decisions.md) has the rest of that
comparison.

## Caching

The three caches below use the Workers Cache API, which needs no binding and
expires entries itself ([lib/cache.ts](src/lib/cache.ts),
[lib/remember.ts](src/lib/remember.ts)).

| What                           | Key                                                     | Lifetime   |
| ------------------------------ | ------------------------------------------------------- | ---------- |
| Place lookups, misses included | the lower-cased query                                   | 24 hours   |
| Air reports                    | coordinates rounded to two decimals (about a kilometre) | 10 minutes |
| Model narratives               | SHA-256 of the brief                                    | 10 minutes |

Static assets are outside these caches: the edge serves them with an ETag and
`max-age=0, must-revalidate`, so a repeat visit costs conditional requests and a
deploy is never mixed with stale code. The icon is cached for a day.

A neighbourhood checking its air in the same ten minutes makes one upstream
call. Failures are never cached. API replies themselves are `no-store`, because
they describe one household.

## Payload

No framework, no web font, no raster image and no third-party request. Sizes
below are bytes on disk and after `gzip -9`.

| Asset                                     | Files  | Bytes      | Gzipped    |
| ----------------------------------------- | ------ | ---------- | ---------- |
| `index.html`                              | 1      | 14,559     | 3,609      |
| `favicon.svg`                             | 1      | 215        | 198        |
| Stylesheets                               | 4      | 11,312     | 3,885      |
| Front-end modules                         | 12     | 24,802     | 10,756     |
| Shared modules compiled from `src/config` | 3      | 4,103      | 2,203      |
| **Total**                                 | **21** | **54,991** | **20,651** |

## Worker bundle

Bundled and minified with esbuild, the Worker is 169,117 bytes (55,656 gzipped).
It was 514,644 bytes (116,503 gzipped) until zod was imported as a namespace
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
- The second model is asked only after the first has failed or been rejected,
  and a third call is never made
  ([service.test.ts](test/features/assistant/service.test.ts)).
- A request body is read through a byte counter that stops at 4,096 bytes,
  whether or not a length was declared
  ([validate.test.ts](test/middleware/validate.test.ts)).

## In the browser

Lighthouse 13.6.0 against the live page, Chrome 158, 20 Nov 2026. These are
manual runs, not part of `npm run check`.

| Run                                    | Performance    | Accessibility | Best practices | SEO |
| -------------------------------------- | -------------- | ------------- | -------------- | --- |
| Desktop preset, x3                     | 93, 100 and 99 | 100           | 100            | 100 |
| Mobile (simulated slow 4G, 4x CPU), x3 | 100, 100, 100  | 100           | 100            | 100 |

On desktop the largest contentful paint was 0.5 to 0.9 s with no blocking time.
On mobile it was 1.1 to 1.2 s, with 0 to 50 ms of blocking time and no layout
shift. The page weighed 44 KiB over the wire.
