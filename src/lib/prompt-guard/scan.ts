/**
 * The scanner of the prompt-injection screen: runs every rule over untrusted
 * text and reports what it found. It is pure, synchronous code, not a model,
 * so it cannot be argued with. Removal is ./strip.ts; fencing is ./fence.ts.
 */

import { showInvisible } from './invisible';
import { SCREENING_RULES } from './rules';
import type { InjectionFinding, ScreenedField, ScreeningRule } from './types';

/** Upper bound on findings returned, so a crafted request cannot flood the page. */
const MAX_FINDINGS = 25;
/** The longest excerpt quoted back to the visitor. */
const MAX_EXCERPT = 120;

/** One match of one rule: where in the text it sits. */
export interface RuleMatch {
  rule: ScreeningRule;
  start: number;
  end: number;
}

/** Every match of every rule, uncapped. `matchAll` leaves each pattern's `lastIndex` alone. */
export function ruleMatches(text: string): RuleMatch[] {
  return SCREENING_RULES.flatMap((rule) =>
    Array.from(text.matchAll(rule.pattern), (m) => ({
      rule,
      start: m.index,
      end: m.index + m[0].length,
    })),
  );
}

/** Findings for one field's text, in text order, the first {@link MAX_FINDINGS} only. */
export function scanForInjection(text: string, field: ScreenedField): InjectionFinding[] {
  return ruleMatches(text)
    .sort((a, b) => a.start - b.start)
    .slice(0, MAX_FINDINGS)
    .map(({ rule, start, end }) => ({
      field,
      kind: rule.kind,
      detail: rule.detail,
      excerpt: showInvisible(text.slice(start, Math.min(end, start + MAX_EXCERPT))),
      offset: start,
    }));
}
