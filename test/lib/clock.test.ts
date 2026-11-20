/**
 * Tests for the system clock adapter and the calendar arithmetic beside it.
 */
import { expect, it } from 'vitest';
import { dayAfter, systemClock } from '../../src/lib/clock';

it('systemClock tells the current time', () => {
  expect(Math.abs(systemClock.now().getTime() - Date.now())).toBeLessThan(5000);
});

it('dayAfter steps one calendar day, across months, years and leap days', () => {
  expect(dayAfter('2026-11-20')).toBe('2026-11-21');
  expect(dayAfter('2026-11-30')).toBe('2026-12-01');
  expect(dayAfter('2026-12-31')).toBe('2027-01-01');
  expect(dayAfter('2028-02-28')).toBe('2028-02-29');
  expect(dayAfter('2027-02-28')).toBe('2027-03-01');
});
