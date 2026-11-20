/**
 * Tests for the deadline helper: pass-through, rejection, and abort on a hang.
 */
import { expect, it } from 'vitest';
import { withTimeout } from '../../src/lib/timeout';

it('resolves with the call’s value when it finishes in time', async () => {
  expect(await withTimeout(async () => 'done', 1000)).toBe('done');
});

it('passes a rejection through', async () => {
  await expect(withTimeout(() => Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
});

it('rejects with a TimeoutError and aborts the signal when the call hangs', async () => {
  let seen: AbortSignal | undefined;
  const hung = withTimeout((signal) => {
    seen = signal;
    return new Promise<never>(() => undefined);
  }, 5);
  await expect(hung).rejects.toMatchObject({ name: 'TimeoutError' });
  expect(seen?.aborted).toBe(true);
});
