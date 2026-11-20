/**
 * Tests for the totals and the recommendation cards: the engine’s numbers,
 * the working behind them, and where each card is filed.
 */
import { afterEach, expect, it, vi } from 'vitest';
import { COMMUNITY, FAMILY, flatAir } from '../support/fixtures';
import { byId } from '../support/page.dom';
import { modelNarrative, okReply, planReply } from '../support/replies.dom';
import { cards, partText, renderWith } from '../support/results.dom';
afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows the engine’s totals', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  expect(byId('total-inhaled').textContent).toBe('1,593.2 µg a day');
  expect(byId('total-emitted').textContent).toBe('0 g a week');
  expect(byId('total-co2e').textContent).toBe('32.6 kg CO2e a week');
  expect(byId('total-equivalent').textContent).toContain('642 minutes (10.7 hours) of breathing');
});

it('files each recommendation under its heading from the brief, with its impact and working', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  expect(cards('routine').map((c) => c.id.slice(4))).toEqual([
    'shift-outdoor-time',
    'air-at-cleanest-hour',
  ]);
  expect(cards('indoor')).toHaveLength(3);
  expect(cards('alternative').map((c) => c.id.slice(4))).toEqual(['switch-commute']);
  const [shift] = cards('routine');
  expect(partText(shift, 'title')).toBe('Move outdoor time to 3 pm');
  expect(partText(shift, 'impact')).toBe(
    'Direct impact: about 468 µg of PM2.5 a day not breathed in, counting everyone in the plan.',
  );
  expect(partText(shift, 'calc')).toBe('(180 − 30 µg/m³) × 1.56 m³/h × 0.5 h × 4 people');
  expect(partText(shift, 'factors')).toContain(
    'Air breathed in moderate exercise: 1.56 m³/h. Published figure: US EPA',
  );
});

it('labels assumptions as assumptions', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  const seal = cards('indoor').find((c) => c.id.slice(4) === 'seal-gaps');
  expect(seal?.querySelector('.rec__factors')?.textContent).toContain('Assumption: ');
});

it('marks a choice already made, and says when a category has nothing to change', async () => {
  const profile = { ...FAMILY, commute: 'metro' as const, outdoorTime: 'none' as const };
  await renderWith(
    okReply(planReply(profile, flatAir(10))),
    okReply(await modelNarrative(profile)),
  );
  const [keep] = cards('alternative');
  expect(keep?.querySelector<HTMLElement>('.rec__status')?.hidden).toBe(false);
  expect(byId('list-routine').textContent).toBe(
    'Nothing to change here: your current choices are already the cleaner option.',
  );
});

it('lists community recommendations for a community', async () => {
  await renderWith(okReply(planReply(COMMUNITY)), okReply(await modelNarrative(COMMUNITY)));
  expect(cards('alternative').map((c) => c.id.slice(4))).toContain('stop-waste-burning');
});

it('names each "How this was calculated" disclosure after its card, starting with the visible text', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  const summaries = [...byId('results').querySelectorAll<HTMLElement>('.rec summary')];
  expect(summaries).toHaveLength(6);
  for (const summary of summaries) {
    const title = partText(summary.closest<HTMLElement>('.rec') ?? undefined, 'title');
    expect(summary.getAttribute('aria-label')).toBe(`How this was calculated: ${title}`);
    expect(summary.getAttribute('aria-label')?.startsWith(summary.textContent)).toBe(true);
  }
  const names = summaries.map((summary) => summary.getAttribute('aria-label'));
  expect(new Set(names).size).toBe(names.length);
});
