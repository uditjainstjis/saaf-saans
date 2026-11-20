/**
 * Tests for the system clock adapter.
 */
import { expect, it } from 'vitest';
import { systemClock } from '../../src/lib/clock';

it('systemClock tells the current time', () => {
  expect(Math.abs(systemClock.now().getTime() - Date.now())).toBeLessThan(5000);
});
