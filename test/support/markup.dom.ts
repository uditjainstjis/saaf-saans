/**
 * Lookups over the shipped markup and stylesheets for the structural
 * accessibility tests in test/a11y/.
 */

import { css, shipped } from './shipped.dom';

/** Every element matching a selector. */
export const all = <T extends Element = Element>(selector: string): T[] => [
  ...document.querySelectorAll<T>(selector),
];

/** The whole shipped stylesheet. */
export const sheet = css();
/** The shipped markup. */
export const html = shipped('index.html');

/** The pixel value of a `--name: NNpx` token. */
export const tokenPx = (name: string): number =>
  Number(new RegExp(`--${name}: (\\d+)px;`).exec(sheet)?.[1] ?? 0);

/** The declarations of the first rule whose selector list ends with `selector`. */
export function rule(selector: string): string {
  const start = sheet.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no rule for ${selector}`);
  return sheet.slice(start, sheet.indexOf('}', start));
}
