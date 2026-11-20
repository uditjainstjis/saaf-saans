/**
 * What a model reply must be before any of it is shown: one JSON object of
 * the agreed shape, one explanation for every recommendation and for nothing
 * else, and no numeral the facts did not contain. Shape: ./schemas.ts.
 */

import type { PlanBrief } from '../plan/types';
import { factsOf } from './facts';
import { numbersIn, unsupportedNumbers } from './number-firewall';
import { extractJson } from './reply-parser';
import { type NarrativeReply, narrativeReply } from './schemas';
import type { Narrative } from './types';

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
