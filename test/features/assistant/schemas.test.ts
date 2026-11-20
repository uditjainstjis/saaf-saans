import { describe, expect, it } from 'vitest';
import {
  checkReply,
  NARRATIVE_JSON_SCHEMA,
  narrativeSchema,
} from '../../../src/features/assistant/schemas';
import { briefFor } from '../../support/fixtures';
import { goodReply, NARRATIVE } from '../../support/fakes';

const brief = briefFor();
const issuesOf = (raw: unknown): string[] => {
  const verdict = checkReply(raw, brief);
  return verdict.ok ? [] : verdict.issues;
};

describe('checkReply', () => {
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

  it('rejects a reply that is not a JSON object of the agreed shape', () => {
    expect(issuesOf('I cannot help with that.')).not.toEqual([]);
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
});

describe('the schemas', () => {
  it('gives the model host a JSON Schema requiring all three parts', () => {
    expect(NARRATIVE_JSON_SCHEMA).toMatchObject({
      type: 'object',
      required: ['summary', 'explanations', 'encouragement'],
      additionalProperties: false,
    });
  });

  it('recognises a cached narrative and refuses anything else', () => {
    expect(narrativeSchema.safeParse(NARRATIVE).success).toBe(true);
    expect(narrativeSchema.safeParse({ ...NARRATIVE, source: 'guess' }).success).toBe(false);
  });
});
