/**
 * Tests for body validation through the real application: every invalid field
 * reported, and bodies that are not JSON.
 */
import { expect, it } from 'vitest';
import { FAMILY } from '../support/fixtures';
import { appWith, post, type Refusal } from '../support/http';

it('answers 400 with every invalid field, so the form can show them all', async () => {
  const res = await appWith().fetch(post('/api/plan', { ...FAMILY, adults: 0, commute: 'jet' }));
  expect(res.status).toBe(400);
  const body = await res.json<Refusal>();
  expect(body.code).toBe('invalid_input');
  expect(body.issues).toEqual([
    { field: 'commute', message: 'Commute: choose one of the listed options.' },
    { field: 'adults', message: 'Adults must be between 1 and 12.' },
  ]);
  expect(body.error).toContain('Adults must be between');
});

it('files a problem with the request as a whole under the form itself', async () => {
  const res = await appWith().fetch(post('/api/plan', '"just a string"'));
  expect((await res.json<Refusal>()).issues[0]?.field).toBe('form');
});

it('answers 400 for a body that is not JSON', async () => {
  const res = await appWith().fetch(post('/api/plan', '{not json'));
  expect(res.status).toBe(400);
  expect((await res.json<Refusal>()).code).toBe('bad_json');
});
