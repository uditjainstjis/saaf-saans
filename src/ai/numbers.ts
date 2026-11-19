/**
 * The number firewall: a model may repeat a figure it was given, and nothing
 * else. Every numeral in generated text must appear among the facts in the
 * prompt, which come from the impact engine; text that carries any other
 * numeral is rejected. This is what makes "the model explains, the engine
 * computes" a property of the code rather than a request in a prompt.
 */

/** Names that contain digits without being quantities. */
const NAMES = /\b(?:PM2\.5|PM10|N95|CO2e?|MERV-13)(?![\w.])/gi;
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
