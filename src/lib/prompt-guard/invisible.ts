/**
 * Characters that render as nothing: zero-width space, joiners, direction
 * marks, bidi embeddings and overrides, invisible operators and the byte-order
 * mark. Used by ./rules/hidden-characters.ts and by excerpts in ./scan.ts.
 */

/** A character class matching one invisible character, as pattern source. */
export const INVISIBLE = '[\\u200b-\\u200f\\u202a-\\u202e\\u2060-\\u2064\\ufeff]';

/** The text with each invisible character drawn as a box, so an excerpt is not blank. */
export const showInvisible = (text: string): string =>
  text.replace(new RegExp(INVISIBLE, 'g'), '□');
