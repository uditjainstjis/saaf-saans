/**
 * Tests for the assistant card: who wrote the text, where explanations go,
 * and that the plan survives any assistant failure.
 */
import { afterEach, expect, it, vi } from 'vitest';
import { rulePlanGenerator } from '../../src/features/assistant/generators/rules';
import { briefFor } from '../support/fixtures';
import { byId } from '../support/page.dom';
import { modelNarrative, okReply, planReply } from '../support/replies.dom';
import { cards, renderWith } from '../support/results.dom';
afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows the model’s summary and adds its explanation to each card, labelled as AI', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  expect(byId('assistant-source').textContent).toContain('Written by generative AI');
  expect(byId('assistant-summary').textContent).toContain('The assistant says');
  expect(byId('assistant-encouragement').textContent).not.toBe('');
  const ai = cards('routine')[0]?.querySelector<HTMLElement>('.rec__ai');
  expect(ai?.hidden).toBe(false);
  expect(ai?.textContent).toBe('AI explanation: Because it suits your day (shift-outdoor-time).');
});

it('leaves a card as it is when the model had nothing for it', async () => {
  const narrative = { ...(await modelNarrative()), explanations: { 'no-such-card': 'Ignored.' } };
  await renderWith(okReply(planReply()), okReply(narrative));
  expect(cards('routine')[0]?.querySelector<HTMLElement>('.rec__ai')?.hidden).toBe(true);
});

it('says plainly when rules, not a model, wrote the text', async () => {
  await renderWith(okReply(planReply()), okReply(await rulePlanGenerator.generate(briefFor())));
  expect(byId('assistant-source').textContent).toContain('built-in rules');
  expect(byId('assistant-summary').textContent).toContain('Air in Delhi is unhealthy');
  expect(cards('routine')[0]?.querySelector<HTMLElement>('.rec__ai')?.hidden).toBe(true);
});

it.each([
  ['fails', { status: 500, body: {} }],
  ['answers with something else', okReply({ nothing: 'useful' })],
  ['cannot be reached', new Error('offline')],
])('keeps the plan on screen when the assistant %s', async (_name, reply) => {
  await renderWith(okReply(planReply()), reply);
  expect(byId('results').hidden).toBe(false);
  expect(byId('assistant-source').textContent).toBe('The assistant could not be reached');
  expect(byId('status').textContent).toContain('could not be loaded');
  expect(byId('error-summary').hidden).toBe(true);
  expect(cards('indoor')).toHaveLength(3);
});

it('writes model text as text, never as markup', async () => {
  const narrative = await modelNarrative();
  narrative.summary = '<img src=x onerror=alert(1)> breathe';
  await renderWith(okReply(planReply()), okReply(narrative));
  expect(byId('assistant-summary').querySelector('img')).toBeNull();
  expect(byId('assistant-summary').textContent).toBe('<img src=x onerror=alert(1)> breathe');
});
