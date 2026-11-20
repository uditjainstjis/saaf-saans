/**
 * The reasons a reply of the right shape is still rejected: an explanation
 * missing, unknown or repeated; a numeral the facts did not contain; a text cut
 * mid-sentence or missing a word; a claim that nobody is at risk
 * (./risk-claims.ts). Each is worded to hand back to a model. Used by ./reply-checks.ts.
 */
import type { PlanBrief } from '../plan/types';
import { factsOf } from './facts';
import { numbersIn, unsupportedNumbers } from './number-firewall';
import { riskIssues } from './risk-claims';
import type { NarrativeReply } from './schemas';

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

/** How a finished sentence ends: . ! or ?, optionally followed by a closing quote or bracket. */
const SENTENCE_END = /[.!?]["'”’)\]]?$/;

/** Every text of a reply, with the name a model knows it by. */
function namedTexts(reply: NarrativeReply): [string, string][] {
  return [
    ['The summary', reply.summary],
    ...reply.explanations.map((e): [string, string] => [`The explanation for "${e.id}"`, e.text]),
    ['The encouragement', reply.encouragement],
  ];
}

/** Texts that stop without ending a sentence, as a string cut at its length limit does. */
function endingIssues(reply: NarrativeReply): string[] {
  return namedTexts(reply)
    .filter(([, text]) => !SENTENCE_END.test(text))
    .map(([name]) => `${name} stops mid-sentence; write it shorter and end it with a full stop.`);
}

/** Two spaces inside a sentence: what is left when a model drops a word or a figure ("10 pm to  am"). */
const GAP = /[^.!?:;\s]\s{2,}\S/;

/** Texts with a gap where a word is missing. Two spaces after a full stop are a typing habit, not a gap. */
function gapIssues(reply: NarrativeReply): string[] {
  return namedTexts(reply)
    .filter(([, text]) => GAP.test(text))
    .map(
      ([name]) => `${name} has a gap where a word is missing; write the sentence again in full.`,
    );
}

/** Every reason to reject a well-shaped reply to this brief; empty when there is none. */
export function issuesIn(reply: NarrativeReply, brief: PlanBrief): string[] {
  const expected = brief.plan.recommendations.map((r) => r.id);
  return [
    ...idIssues(reply, expected),
    ...numberIssues(reply, brief),
    ...endingIssues(reply),
    ...gapIssues(reply),
    ...riskIssues(namedTexts(reply), brief),
  ];
}
