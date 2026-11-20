/**
 * Tests for POST /api/assistant through the real application: the generated
 * narrative, the rule-based fallback, and validation.
 */
import { expect, it } from 'vitest';
import { fallbackPlanGenerator } from '../../../src/features/assistant/generators/fallback';
import { rulePlanGenerator } from '../../../src/features/assistant/generators/rules';
import { NARRATIVE, brokenGenerator } from '../../support/assistant-fakes';
import { recordingLogger } from '../../support/fakes';
import { COMMUNITY, FAMILY } from '../../support/fixtures';
import { appWith, post } from '../../support/http';

it('returns the generated narrative', async () => {
  const res = await appWith().fetch(post('/api/assistant', FAMILY));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(NARRATIVE);
});

it('answers from rules when the model is unavailable', async () => {
  const generator = fallbackPlanGenerator(brokenGenerator, rulePlanGenerator, recordingLogger());
  const res = await appWith({ generator }).fetch(post('/api/assistant', COMMUNITY));
  expect(res.status).toBe(200);
  const body = await res.json<{ source: string; summary: string }>();
  expect(body.source).toBe('rules');
  expect(body.summary).toContain('Air in Delhi is unhealthy');
});

it('validates the body exactly as /api/plan does', async () => {
  const res = await appWith().fetch(post('/api/assistant', { ...FAMILY, elders: -1 }));
  expect(res.status).toBe(400);
});
