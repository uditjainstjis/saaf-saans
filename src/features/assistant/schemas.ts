import { z } from 'zod';
import type { Narrative, PlanBrief } from '../../lib/ports';
import { numbersIn, unsupportedNumbers } from './number-firewall';
import { factsOf } from './prompt';
import { extractJson } from './reply-parser';

/**
 * What a model reply must be before any of it is shown: one JSON object of
 * the agreed shape, one explanation for every recommendation and for nothing
 * else, and no numeral the facts did not contain.
 */

/** The reply shape the model is asked for, and held to. */
export const narrativeReply = z.strictObject({
  summary: z.string().trim().min(20).max(600),
  explanations: z
    .array(z.strictObject({ id: z.string().max(60), text: z.string().trim().min(20).max(500) }))
    .min(1)
    .max(20),
  encouragement: z.string().trim().min(5).max(300),
});
type NarrativeReply = z.infer<typeof narrativeReply>;

/** The same shape as JSON Schema, for the model host's constrained decoding. */
export const NARRATIVE_JSON_SCHEMA: object = z.toJSONSchema(narrativeReply);

/** A checked narrative, or every reason the reply was rejected. */
export type Verdict = { ok: true; narrative: Narrative } | { ok: false; issues: string[] };

/** Ids that are missing, unknown or repeated among the explanations. */
function idIssues(reply: NarrativeReply, expected: readonly string[]): string[] {
  const given = reply.explanations.map((e) => e.id);
  const missing = expected.filter((id) => !given.includes(id));
  const unknown = given.filter((id) => !expected.includes(id));
  const repeated = given.filter((id, i) => given.indexOf(id) !== i);
  return [
    ...missing.map((id) => `No explanation for recommendation id "${id}".`),
    ...unknown.map((id) => `"${id}" is not a recommendation id in the FACTS.`),
    ...repeated.map((id) => `More than one explanation for id "${id}".`),
  ];
}

/** Numerals in the reply that the facts and the visitor's notes do not contain. */
function numberIssues(reply: NarrativeReply, brief: PlanBrief): string[] {
  const allowed = new Set(numbersIn(`${factsOf(brief)}\n${brief.profile.notes}`));
  const text = [reply.summary, reply.encouragement, ...reply.explanations.map((e) => e.text)];
  const stray = [...new Set(text.flatMap((t) => unsupportedNumbers(t, allowed)))];
  return stray.map((numeral) => `The number ${numeral} is not in the FACTS; remove it.`);
}

/** Check a raw model reply against a brief. */
export function checkReply(raw: unknown, brief: PlanBrief): Verdict {
  const parsed = narrativeReply.safeParse(extractJson(raw));
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    };
  }
  const reply = parsed.data;
  const expected = brief.plan.recommendations.map((r) => r.id);
  const issues = [...idIssues(reply, expected), ...numberIssues(reply, brief)];
  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    narrative: {
      source: 'model',
      summary: reply.summary,
      explanations: Object.fromEntries(reply.explanations.map((e) => [e.id, e.text])),
      encouragement: reply.encouragement,
    },
  };
}

/** The shape of a {@link Narrative}, for values read back from the cache. */
export const narrativeSchema: z.ZodType<Narrative> = z.strictObject({
  source: z.enum(['model', 'rules']),
  summary: z.string(),
  explanations: z.record(z.string(), z.string()),
  encouragement: z.string(),
});
