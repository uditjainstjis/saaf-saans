# Decisions

Short records of the choices that shaped the code, each with what was given up.

## 1. The model explains, the engine computes

**Decision.** Every figure comes from pure functions over cited factors. The
model receives the finished plan as facts and returns wording; a number firewall
rejects any reply with a numeral that is not in those facts.

**Why.** A plausible invented statistic about health is the worst failure this
product could have, and a prompt asking a model not to invent numbers is a
request, not a guarantee.

**Cost.** The model sometimes fails the check and is replaced by rule-written
text, which is plainer.

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

**Decision.** The page is static HTML, four stylesheets and eleven small ES
modules.

**Why.** One form and one result view do not need a runtime, and 19 KB over the
wire matters on a phone in the cities this is for.

**Cost.** Rendering code is written by hand.
