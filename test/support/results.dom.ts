/**
 * Helpers for tests of the rendered results: submit the form against scripted
 * replies, then read the recommendation cards.
 */

import { byId, inputEl, loadApp, settled, submit } from './page.dom';
import { type Reply, stubFetch } from './replies.dom';

/** Load the page, answer its requests with `replies`, submit for Delhi and wait. */
export async function renderWith(...replies: (Reply | Error)[]): Promise<void> {
  await loadApp();
  stubFetch(...replies);
  inputEl('place').value = 'Delhi';
  submit();
  await settled();
}

/** The recommendation cards under one of the three headings. */
export const cards = (list: string): HTMLElement[] => [
  ...byId(`list-${list}`).querySelectorAll<HTMLElement>('.rec'),
];

/** The text of one part of a recommendation card. */
export const partText = (card: HTMLElement | undefined, part: string): string =>
  card?.querySelector(`.rec__${part}`)?.textContent ?? '';
