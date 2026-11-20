/**
 * The number firewall: reports every numeral (written in digits) in generated
 * text that is not among the facts, so a model cannot introduce a figure of
 * its own. It cannot tell whether a permitted figure is used correctly, which
 * is why the engine's own impact line is always shown. Applied by ./reply-checks.ts.
 */

/** Names that contain digits without being quantities, however a model spaces them ("PM 2.5", "N-95"). */
const NAMES = /\b(?:PM[ -]?2\.5|PM[ -]?10|N[ -]?95|CO2e?|MERV[ -]?13)(?![\w.])/gi;
/** A numeral, with any thousands separators or decimal part. */
const NUMERAL = /\d+(?:[.,]\d+)*/g;

/** The numerals in a text, normalised ("1,200.50" reads as "1200.5"); names such as PM2.5 are not numerals. */
export function numbersIn(text: string): string[] {
  const numerals = text.replace(NAMES, ' ').match(NUMERAL) ?? [];
  return numerals.map((numeral) => String(Number(numeral.replace(/,/g, ''))));
}

/** The numerals in `text` that are not among `allowed`. */
export function unsupportedNumbers(text: string, allowed: ReadonlySet<string>): string[] {
  return numbersIn(text).filter((numeral) => !allowed.has(numeral));
}
