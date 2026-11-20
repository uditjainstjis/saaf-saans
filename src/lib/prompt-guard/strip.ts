/**
 * Removal of injected text before a prompt is built: every sentence that holds
 * a rule match is cut, so nothing the screen flags reaches a model. Matching
 * is ./scan.ts; what is left is fenced by ./fence.ts.
 */

import { type RuleMatch, ruleMatches } from './scan';

/** Where sentences end: full stops and line breaks (where the rules stop), and ! and ?. */
const SENTENCE_END = new Set(['.', '!', '?', '\n']);
const endsSentence = (text: string, i: number): boolean => SENTENCE_END.has(text.charAt(i));

/** The sentence around `text[start, end)`: from after the previous sentence end to the next one. */
function sentenceAround(text: string, { start, end }: RuleMatch): [number, number] {
  let from = start;
  // A match can open on the line break that ends the sentence before it.
  while (from < end && endsSentence(text, from)) from++;
  while (from > 0 && !endsSentence(text, from - 1)) from--;
  let to = end;
  while (to < text.length && !endsSentence(text, to)) to++;
  return [from, Math.min(to + 1, text.length)];
}

/** The text with every sentence that holds a match removed; empty when nothing is left. */
export function withoutInjection(text: string): string {
  const cuts = ruleMatches(text)
    .map((match) => sentenceAround(text, match))
    .sort((a, b) => a[0] - b[0]);
  let kept = '';
  let at = 0;
  for (const [from, to] of cuts) {
    kept += text.slice(at, Math.max(at, from));
    at = Math.max(at, to);
  }
  return (kept + text.slice(at)).trim();
}
