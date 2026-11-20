/**
 * Tests for the checks on a model reply: one whole JSON object of the agreed
 * shape, one explanation per recommendation, and the number firewall.
 */
import { expect, it } from 'vitest';
import { checkReply } from '../../../src/features/assistant/reply-checks';
import { goodReply } from '../../support/assistant-fakes';
import { briefFor } from '../../support/fixtures';

const brief = briefFor();

const issuesOf = (raw: unknown): string[] => {
  const verdict = checkReply(raw, brief);
  return verdict.ok ? [] : verdict.issues;
};

it('accepts a complete reply and keys the explanations by recommendation id', () => {
  const verdict = checkReply({ response: goodReply(brief) }, brief);
  expect(verdict.ok).toBe(true);
  if (!verdict.ok) return;
  expect(verdict.narrative.source).toBe('model');
  expect(Object.keys(verdict.narrative.explanations)).toEqual(
    brief.plan.recommendations.map((r) => r.id),
  );
});

it('accepts figures that are in the facts or in the visitor’s own notes', () => {
  const reply = goodReply(brief);
  reply.summary = 'PM2.5 is 149 µg/m³ now; moving outdoors to 3 pm avoids about 468 µg a day.';
  expect(issuesOf(reply)).toEqual([]);
  const withNotes = briefFor({ ...brief.profile, notes: 'We have 2 dogs and walk 45 minutes.' });
  const walk = goodReply(withNotes);
  walk.encouragement = 'Keep the 45 minute dog walk, just later in the day.';
  expect(checkReply(walk, withNotes).ok).toBe(true);
});

it('gives a plain reason for a reply with no whole JSON object, as one cut off mid-way has', () => {
  const reason =
    'The reply was not one complete JSON object; write the whole object and keep every sentence short.';
  expect(issuesOf('I cannot help with that.')).toEqual([reason]);
  expect(issuesOf('{"summary": "Air in Delhi is unhealthy", "explanations": [{"id": "a')).toEqual([
    reason,
  ]);
  expect(issuesOf(null)).toEqual([reason]);
});

it('rejects a reply that is not a JSON object of the agreed shape', () => {
  expect(issuesOf({ summary: 'too short' })).not.toEqual([]);
  expect(issuesOf({ ...goodReply(brief), extra: 'field' })[0]).toContain('Unrecognized key');
  expect(issuesOf({ ...goodReply(brief), summary: 'short' })[0]).toMatch(/^summary: /);
});

it('rejects a missing, an unknown and a repeated recommendation id', () => {
  const reply = goodReply(brief);
  const renamed = reply.explanations.map((e, i) =>
    i === 1 ? { ...e, id: 'buy-our-purifier' } : e,
  );
  const tampered = { ...reply, explanations: [...renamed, ...reply.explanations.slice(0, 1)] };
  expect(issuesOf(tampered)).toEqual([
    'No explanation for recommendation id "air-at-cleanest-hour".',
    '"buy-our-purifier" is not a recommendation id in the FACTS.',
    'More than one explanation for id "shift-outdoor-time".',
  ]);
});

it('rejects any number the impact engine did not compute: the number firewall', () => {
  const reply = goodReply(brief);
  reply.summary = 'This plan cuts your exposure by 87% and adds 77 years to your life.';
  reply.encouragement = 'Just 87 more days of winter!';
  expect(issuesOf(reply)).toEqual([
    'The number 87 is not in the FACTS; remove it.',
    'The number 77 is not in the FACTS; remove it.',
  ]);
});
