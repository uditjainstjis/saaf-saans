# Decisions

Short records of the choices that shaped the code, each with what was given up.

## 1. The model explains, the engine computes

**Decision.** Every figure comes from pure functions over cited factors. The
model receives the finished plan as facts and returns wording; a number firewall
rejects any reply with a numeral that is not in those facts.

**Why.** A plausible invented statistic about health is the worst failure this
product could have, and a prompt asking a model not to invent numbers is a
request, not a guarantee.

**Cost.** A reply sometimes fails the check. A second model is then asked (see
record 10), and when that fails too the text is written by rules, which is
plainer.

## 2. Two routes, split by cost

**Decision.** `POST /api/plan` is deterministic and fast; `POST /api/assistant`
is the generative step. The page renders the first and fills in the second.

**Why.** Nobody should wait on a model to see their air, and a model outage
should cost one paragraph, not the page.

**Cost.** The brief is computed twice. Caching the place and the air makes the
second pass cheap.

## 3. Ports, adapters and one composition root

**Decision.** Every dependency on the platform or the network is an interface
declared by the code that needs it; `src/index.ts` alone chooses
implementations.

**Why.** It makes the suite hermetic without a mocking library or a cast, and it
makes cache, fallback and offline behaviour composable decorators.

**Cost.** More small files, and one module with many imports.

## 4. Strategies in a registry

**Decision.** Each piece of advice is a strategy object in its own file; the
planner runs a list.

**Why.** New advice is the most likely change to this product, and it should not
require editing the planner, the API or the page.

**Cost.** Shared arithmetic has to be factored out deliberately (see
`outdoor-session.ts`, `commute.ts`, `clean-room.ts`).

## 5. US AQI from the data source

**Decision.** The index and the dominant pollutant are read from Open-Meteo's US
AQI fields rather than computed from concentration tables.

**Why.** It removes hand-typed breakpoint tables for five pollutants, a likely
source of silent error. The one conversion kept (PM2.5 to AQI) is used only by
the offline fallback.

**Cost.** India's national index is not shown.

## 6. A strict policy instead of a nonce

**Decision.** The Content Security Policy is `script-src 'self'` and
`style-src 'self'` with Trusted Types required, and the page has no inline code.

**Why.** Static assets are served by the edge without the Worker, so there is
nowhere to mint a per-request nonce without giving that up; with nothing inline,
a nonce would have nothing to authorise.

**Cost.** Every script and style must live in its own file.

## 7. An offline fallback that says what it is

**Decision.** When Open-Meteo cannot be reached, the app plans from typical
winter values for ten Indian cities (or a default), marks the report `typical`,
and says so on the page.

**Why.** Advice for a typical smog day is more use than an error page, as long
as it is never mistaken for a measurement.

**Cost.** The figures are illustrative, and place search falls back to those ten
cities only: any other name is refused with a clear message until the geocoder
is reachable again.

## 8. Published figures and assumptions, kept apart

**Decision.** Every factor carries a `kind`: `published` only when the value was
read in the named source, `assumption` otherwise, and the interface shows the
label beside every number.

**Why.** Exposure modelling needs judgement calls. Hiding them among cited
figures would make the whole calculation look more certain than it is.

**Cost.** Most recommendations show at least one assumption.

## 9. No framework

**Decision.** The page is static HTML, four stylesheets and twelve small ES
modules.

**Why.** One form and one result view do not need a runtime, and 21 KB gzipped
matters on a phone in the cities this is for.

**Cost.** Rendering code is written by hand.

## 10. Two models in turn, and short replies

**Decision.** The assistant asks `@cf/mistralai/mistral-small-3.1-24b-instruct`
first and `@cf/meta/llama-3.3-70b-instruct-fp8-fast` second. The second is asked
once, and only when the first call fails, times out or returns a reply that is
rejected: with the reasons after a rejection, with the original request after a
failure. Replies are short: a two-sentence summary, one sentence per
recommendation and a closing line, inside a 600-token output budget. The
deadline of one call stays at 15 s.

**Why.** With one model and a 900-token budget, the deployed service answered
`POST /api/plan` in 1.0 s but `POST /api/assistant` after 15.9 s with
`source: rules`; the log read
`plan_generator_failed … TimeoutError: call exceeded 15000ms`. Candidates were
then timed on an instrumented copy with a 60 s deadline, one call each, with the
usage the binding reported:

| Model                                                                  | One call                                                                                                          |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast`                             | 490 completion tokens in 14.0 s (about 35 tokens/s), 134 neurons; without `response_format`, 501 tokens in 15.8 s |
| `@cf/mistralai/mistral-small-3.1-24b-instruct`                         | 368 completion tokens in 9.1 s, 61 neurons; the reply passed every check first time                               |
| `@cf/google/gemma-4-26b-a4b-it`, `@cf/openai/gpt-oss-20b`              | Spent all 900 tokens (reasoning) and were rejected twice                                                          |
| `@cf/meta/llama-4-scout-17b-16e-instruct`, `@cf/zai-org/glm-4.7-flash` | No reply in 60 s                                                                                                  |
| `@cf/qwen/qwen3-30b-a3b-fp8`, `@cf/meta/llama-3.1-8b-instruct-fp8`     | `AiError 5028`: deprecated on 2026-11-20                                                                          |

Two things follow. Schema mode is not the cost, output length is: the same model
took 14.0 s with it and 15.8 s without. And models are withdrawn, so a single
model with no second choice is an outage waiting for a date. After the change,
six profiles on Cloudflare took 8.2 to 11.4 s, each written by the first model
on its first attempt (see [EFFICIENCY.md](../EFFICIENCY.md)).

**Cost.** A request can now make two model calls, so the slowest path to the
rule-written text is two deadlines rather than one, and the page allows 45 s for
it. One sentence says less than a paragraph: the model gives the reason a step
matters, and the figures stay with the engine's impact line beside it. The first
model's timed call cost 61 neurons and the second's 134, against a free
allowance of 10,000 a day.

## 11. A second provider, asked first when a key is configured

**Decision.** When the Worker has an `NVIDIA_API_KEY` secret, the assistant asks
NVIDIA's `nvidia/nemotron-3.5-bolt-e4b` first and the Mistral model on Workers
AI second. Without the secret nothing changes: Mistral first, Llama second.
Either way a request makes at most two model calls, each under the same 15 s
deadline, and every reply passes the same checks.

**How.** One more adapter behind the same port
([nvidia.ts](../src/features/assistant/nvidia.ts)), chosen at the composition
root ([src/index.ts](../src/index.ts)). It makes one call to NVIDIA's
OpenAI-compatible API,
`POST https://integrate.api.nvidia.com/v1/chat/completions`, with the key in the
`Authorization: Bearer` header and a body of `model`, `messages` (the system
prompt, then the computed facts and fenced notes), `max_tokens` (600) and
`temperature` (0.3). It sends no `response_format` or schema field: the system
prompt already asks for the JSON object, and the reply was measured without one.
The answer arrives in `choices[0].message.content`, which the reply parser
already read for Workers AI models.

**Why.** Two models at one host share that host's bad days: on 20 Nov 2026 two
Workers AI models had been withdrawn and two others did not answer within 60 s.
A model at a second provider does not depend on that host. The measurements
behind the choice: on 20 Nov 2026, from the development machine, with the app's
real system prompt, a six-recommendation plan and a 600-token budget,
`nemotron-3.5-bolt-e4b` answered with HTTP 200 in 3.5 s, wrote 291 completion
tokens and no reasoning tokens, and its reply passed every one of the app's
checks. The Workers AI path measured 8.2 to 11.4 s the same day, for the whole
`POST /api/assistant` route on Cloudflare, plan rebuild included (see
[EFFICIENCY.md](../EFFICIENCY.md)); the two figures were taken under different
conditions.

On Cloudflare, with the key set, the whole route then took 4.8 to 5.4 s for six
profiles, against 8.2 to 11.4 s on the Workers AI path the same day.

**Cost.** One optional secret to hold, and a second host that receives the
computed facts and the fenced notes. Not every model NVIDIA hosts was usable on
20 Nov 2026: `google/gemma-4-31b-it`, `mistralai/mistral-large-4-1t-a52b`,
`moonshotai/kimi-k3.1-pro`, `meta/muse-glimmer-30b` and
`nvidia/nemotron-3-ultra-550b-a55b` gave no reply in 40 s;
`nvidia/nemotron-3.5-lightning-30b-a3b`,
`nvidia/nemotron-3.5-super-vl-120b-a12b` and `stepfun-ai/step-5-preview` spent
their whole token budget on reasoning and returned no text; `z-ai/glm-5.3-flash`
returned 502 and `minimaxai/minimax-m3.1-flash` 529.

## 12. A reminder is a link, not an integration

**Decision.** Advice that names an hour (airing at the cleanest hour, shutting
windows through the peak, moving outdoor time) carries an "Add a reminder to
Google Calendar" link. A pure function
([calendar.ts](../src/features/plan/calendar.ts)) builds Calendar's
`render?action=TEMPLATE` address from the advice, the next day's date at the
place and the place's time zone.

**Why.** A routine changes when something reminds you at the hour. A link needs
no key, no script and no request: nothing is loaded from Google, the Content
Security Policy is unchanged, and the visitor chooses whether to open it. The
page makes a link only of an address that begins with Calendar's own
([reminder.js](../public/js/reminder.js)).

**Cost.** The hour comes from today's forecast and is carried to tomorrow. The
event's note says so and asks the visitor to check again.
