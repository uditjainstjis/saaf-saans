/**
 * Tests for the Calendar reminder on a card: shown only on advice with a clock
 * time, named after its card, opened safely in a new tab, and never pointed
 * anywhere but Google Calendar.
 */
import { afterEach, expect, it, vi } from 'vitest';
import { FAMILY, SMOG } from '../support/fixtures';
import { modelNarrative, okReply, planReply } from '../support/replies.dom';
import { cards, partText, renderWith } from '../support/results.dom';

afterEach(() => {
  vi.unstubAllGlobals();
});

const WORDS = 'Add a reminder to Google Calendar';
const allCards = (): HTMLElement[] => ['routine', 'indoor', 'alternative'].flatMap(cards);
/** A card's reminder link; every card has one, shown or not. */
function linkOf(card: HTMLElement): HTMLAnchorElement {
  const link = card.querySelector<HTMLAnchorElement>('a.rec__remind');
  if (!link) throw new Error(`no reminder link in ${card.id}`);
  return link;
}
const reminded = (): HTMLElement[] => allCards().filter((card) => !linkOf(card).hidden);

it('shows a reminder on the cards with a clock time, and on no other', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  expect(allCards()).toHaveLength(6);
  expect(reminded().map((card) => card.id)).toEqual([
    'rec-shift-outdoor-time',
    'rec-air-at-cleanest-hour',
    'rec-close-at-peak',
  ]);
  for (const card of allCards().filter((c) => linkOf(c).hidden)) {
    expect(linkOf(card).hasAttribute('href'), card.id).toBe(false);
  }
});

it('names each link after its card, starting with the words on screen', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  const names = reminded().map((card) => {
    const link = linkOf(card);
    expect(link.text.trim()).toBe(WORDS);
    expect(link.getAttribute('aria-label')).toBe(
      `${WORDS}: ${partText(card, 'title')} (opens in a new tab)`,
    );
    return link.getAttribute('aria-label');
  });
  expect(new Set(names).size).toBe(3);
});

it('opens Google Calendar in a new tab, for that card, without handing the page over', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  for (const card of reminded()) {
    const link = linkOf(card);
    const url = new URL(link.href);
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('text')).toBe(partText(card, 'title'));
    expect(url.searchParams.get('ctz')).toBe('Asia/Kolkata');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
  }
});

it.each([
  'javascript:alert(1)',
  'https://calendar.google.com.evil.example/calendar/render?action=TEMPLATE',
  'https://evil.example/?next=https://calendar.google.com/calendar/render?',
  'http://calendar.google.com/calendar/render?action=TEMPLATE',
])('makes no link out of %s', async (calendarUrl) => {
  const plan = planReply();
  const recommendations = plan.recommendations.map((rec) => ({ ...rec, calendarUrl }));
  await renderWith(okReply({ ...plan, recommendations }), okReply(await modelNarrative()));
  expect(reminded()).toEqual([]);
  expect(document.querySelectorAll('a.rec__remind[href]')).toHaveLength(0);
});

it('offers no reminder when the air is typical, which does not know its day', async () => {
  const typical = { ...SMOG, source: 'typical' as const, local: undefined };
  await renderWith(okReply(planReply(FAMILY, typical)), okReply(await modelNarrative()));
  expect(allCards().length).toBeGreaterThan(0);
  expect(reminded()).toEqual([]);
});
