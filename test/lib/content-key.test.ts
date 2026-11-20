/**
 * Tests for content-addressed cache keys.
 */
import { expect, it } from 'vitest';
import { contentKey } from '../../src/lib/content-key';

it('is a stable SHA-256 hex digest that differs when any part differs', async () => {
  const key = await contentKey(['a', 'b']);
  expect(key).toMatch(/^[0-9a-f]{64}$/);
  expect(await contentKey(['a', 'b'])).toBe(key);
  expect(await contentKey(['ab', ''])).not.toBe(key);
});
