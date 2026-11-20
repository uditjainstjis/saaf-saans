/**
 * Tests for the error handler: an unexpected fault is logged and answered
 * without detail.
 */
import { expect, it } from 'vitest';
import { brokenGenerator } from '../support/assistant-fakes';
import { recordingLogger } from '../support/fakes';
import { FAMILY } from '../support/fixtures';
import { appWith, post } from '../support/http';

it('answers 500 without detail when something unexpected breaks, and logs it', async () => {
  const logger = recordingLogger();
  const res = await appWith({ generator: brokenGenerator, logger }).fetch(
    post('/api/assistant', FAMILY),
  );
  expect(res.status).toBe(500);
  const body = await res.json<{ error: string; code: string }>();
  expect(body).toEqual({ error: 'Something went wrong. Please try again.', code: 'internal' });
  expect(JSON.stringify(body)).not.toContain('model down');
  expect(logger.events).toEqual(['unhandled_error']);
});
