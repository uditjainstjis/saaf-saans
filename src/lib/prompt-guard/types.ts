/**
 * Types of the prompt-injection screen: what a rule is, and what a finding
 * shown to the visitor carries. The rules live in ./rules/, the scanner in
 * ./scan.ts.
 */

/** A request field that carries free text. */
export type ScreenedField = 'place' | 'notes';

/** One piece of text aimed at an AI reader, found in a request field. */
export interface InjectionFinding {
  field: ScreenedField;
  kind: string;
  detail: string;
  excerpt: string;
  offset: number;
}

/** One screening rule: what it looks for, and how a finding is explained. */
export interface ScreeningRule {
  kind: string;
  detail: string;
  pattern: RegExp;
}
