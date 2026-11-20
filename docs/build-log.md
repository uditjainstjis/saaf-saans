# How Saaf Saans was built with generative AI

Generative AI was used twice in this project: to build it, and inside it. This
page records the tools, why each was chosen, the prompts that mattered, how they
changed, and who did what.

## Tools and why

| Tool                                                  | Used for                                                     | Why this one                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code (Anthropic), in the terminal              | Writing the code, tests and documentation; running checks    | It runs the whole loop itself (edit, test, measure, deploy), and one agent's work can be re-checked by another from a fresh clone                                                                                 |
| Cloudflare Workers AI (binding)                       | The app's generative step: wording the computed plan         | A binding needs no API key                                                                                                                                                                                        |
| `@cf/mistralai/mistral-small-3.1-24b-instruct`        | First model asked                                            | Measured: fastest reply that passed every check, at under half the cost of the 70B model                                                                                                                          |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast`            | Second model, asked when the first fails or is rejected      | Measured: passes the checks; slower, so it is the second choice                                                                                                                                                   |
| NVIDIA API (`nvidia/nemotron-3.5-bolt-e4b`), optional | First model asked when an `NVIDIA_API_KEY` secret is set     | Measured from the development machine on 20 Nov 2026 with the app's real system prompt: 3.5 s, and the reply passed every check. On Cloudflare the whole assistant route then took 4.8 to 5.4 s for six profiles. |
| Open-Meteo Air Quality and Geocoding APIs             | Live air for the place typed                                 | Free, keyless, CAMS-based, with an hourly forecast                                                                                                                                                                |
| Vitest in workerd, axe-core, Lighthouse, Playwright   | Tests, accessibility checks, page audits, the demo recording | They exercise the same runtime and the same page that are deployed                                                                                                                                                |

## The prompt flow while building

The work was driven by written briefs, each ending in a demand for raw command
output instead of a summary. Three mattered.

**1. Product and architecture.** The first brief quoted the challenge statement
and turned it into a checklist:

> Clause checklist the app and README must map 1:1 (use these exact phrases as
> section names in UI and README): GenAI-powered assistant · families AND
> communities · severe winter smog / urban air pollution · low-emission daily
> routines · indoor air quality hacks · sustainable alternatives · tailored to
> location · tailored to lifestyle · clearly explaining the direct impact of
> their choices (quantified: e.g. estimated PM2.5 exposure avoided, kg CO2e
> saved, computed by deterministic, unit-tested functions with cited factors,
> not made up by the model).

It also fixed the one design decision the project rests on:

> The model explains; the numbers come from the deterministic impact engine.

and named the six evaluation parameters (code quality, security, efficiency,
testing, accessibility, problem statement alignment) as requirements, each with
a way to check it: lint caps, a 100% coverage gate, axe-core and contrast tests,
`npm audit`.

**2. Structure.** A second brief reorganised the first working version into
feature folders with lint-enforced limits (110 lines a file, 30 a function,
complexity 8), and set a rule for the documentation:

> Honesty rule for all docs: only statements that are true of the code, numbers
> copied from real command output. Do NOT write self-awarded scores …

**3. Fixes from production.** The third brief was written from measurements on
the deployed site instead of from a guess:

> `POST /api/assistant`: `source: rules` after 15.9 s; log
> `plan_generator_failed … TimeoutError: call exceeded 15000ms`.
> `@cf/meta/llama-3.3-70b-instruct-fp8-fast`: 490 completion tokens in 14.0 s
> (about 35 tokens/s) … Without `response_format` it was 501 tokens in 15.8 s,
> so schema mode is not the cost; output length is.

## The prompt flow inside the app

1. The engine computes the plan. Nothing below can change a figure.
2. Visitor notes are screened for prompt injection and fenced
   ([lib/prompt-guard/](../src/lib/prompt-guard/)).
3. The model receives fixed instructions
   ([prompt.ts](../src/features/assistant/prompt.ts)) and the computed facts
   ([facts.ts](../src/features/assistant/facts.ts)), and must answer in JSON
   that matches a schema.
4. The reply is checked
   ([reply-checks.ts](../src/features/assistant/reply-checks.ts)): shape, one
   explanation per recommendation, no numeral outside the facts, every sentence
   finished and no word dropped.
5. A failed or rejected reply gets one more attempt on the second model. If that
   fails too, a rule-based generator writes the same structure and the page says
   so.

## How the prompts changed

Each row is one wording of the instruction for the per-recommendation
explanations, with what was measured on Cloudflare and what changed next.

| Version | What the model was asked for                                                              | What was measured                                                                                                                                             | Change that followed                                                  |
| ------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1       | "one or two sentences" per recommendation and a two-to-three sentence summary             | 490 tokens in 14.0 s on the 70B model; the 15 s deadline was missed on the live site                                                                          | Ask for less, and ask a faster model first                            |
| 1       | Length limited only by `maxLength` in the JSON Schema                                     | A summary cut off mid-sentence: constrained decoding stops at the limit                                                                                       | State the limits in words; reject a text that does not end a sentence |
| 2       | ONE sentence of at most 30 words; "start from these people, not from the action"          | 7.0 to 11.3 s over three calls, but thin: "The whole family will breathe cleaner air if you ..." five times in one reply                                      | Ask for the reason, tied to a fact                                    |
| 3       | "Name who among these people gains most from this step and the fact that makes it matter" | 8.9 and 10.2 s; the model echoed the instruction: "Grandmother gains most from this, because ..."                                                             | Ask for advice, not a description                                     |
| 4       | "written to these people as friendly advice", one fact per sentence, varied openings      | 8.2 to 11.4 s over six profiles on the final build; lines such as "The cleanest hour is still above safe limits, so switch your morning exercise indoors ..." | Kept                                                                  |

Two more fixes came from reading live replies rather than from timing them. One
reply read "Keep windows shut from 10 pm to am": the model had dropped the hour
and left two spaces, so a sentence with such a gap is now rejected. Another
wrote "PM 2.5" with a space, which the number check took for an invented figure;
the second model then answered, 17.0 s in all, and the check now reads spaced
pollutant names as names.

A third came from recording the demo on the faster model. For a household with
no child, elder or illness it wrote that "no one in your family is at immediate
risk" in Very unhealthy air. The instructions now take who is at risk from the
health advice in the facts, and a reply that says nobody is at risk in air worse
than moderate is rejected.

Nine models were timed with the same request before choosing two. Two spent
their whole token budget on reasoning and were rejected, two did not answer
within 60 seconds, one small model passed but took longer, and two had been
withdrawn that day, which is why the app never depends on one model.

## Who did what

- **Generative AI (Claude Code):** wrote the code, the tests and the
  documentation; ran the checks, the deployment and the measurements quoted
  here; proposed the architecture.
- **Generative AI (Workers AI, at run time):** words each plan for the people it
  is for. It computes nothing.
- **The author:** chose to enter the challenge, set the goal and the standing
  constraints the briefs carry (no paid services, a light theme with large type
  by default, claims backed by measurements), and decides what is submitted.
- **Not AI at all:** every figure a visitor sees. Those come from fixed formulas
  and cited factors in [features/impact/](../src/features/impact/).
