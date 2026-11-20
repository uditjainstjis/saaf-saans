/**
 * What a model reply must be before any of it is shown: one JSON object of
 * the agreed shape that passes every check in ./reply-issues.ts (one
 * explanation per recommendation, no numeral outside the facts, no text cut
 * mid-sentence or missing a word). Shape: ./schemas.ts; unwrapping: ./reply-parser.ts.
 */
import type { PlanBrief } from '../plan/types';
import { issuesIn } from './reply-issues';
import { extractJson } from './reply-parser';
import { narrativeReply } from './schemas';
import type { Narrative } from './types';

/** A checked narrative, or every reason the reply was rejected. */
export type Verdict = { ok: true; narrative: Narrative } | { ok: false; issues: string[] };

/** The reason given for a reply with no whole JSON object in it, which is how a cut-off reply arrives. */
const NOT_JSON =
  'The reply was not one complete JSON object; write the whole object and keep every sentence short.';

/** Check a raw model reply against a brief. */
export function checkReply(raw: unknown, brief: PlanBrief): Verdict {
  const json = extractJson(raw);
  if (!json) return { ok: false, issues: [NOT_JSON] };
  const parsed = narrativeReply.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return { ok: false, issues };
  }
  const reply = parsed.data;
  const issues = issuesIn(reply, brief);
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
