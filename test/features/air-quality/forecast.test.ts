/**
 * Tests for features/air-quality/forecast.ts: the cleanest and dirtiest hours,
 * the reading at an hour, and clock times.
 */
import { expect, it } from 'vitest';
import { clock, outlookFor, readingAt } from '../../../src/features/air-quality/forecast';
import { smogDay } from '../../support/fixtures';

it('finds the cleanest and the dirtiest hour', () => {
  const { best, worst } = outlookFor(smogDay());
  expect(best).toEqual({ hour: 15, pm25: 30 });
  expect(worst).toEqual({ hour: 22, pm25: 220 });
});

it('keeps the earlier hour on a tie', () => {
  const { best, worst } = outlookFor([
    { hour: 4, pm25: 50 },
    { hour: 5, pm25: 50 },
  ]);
  expect(best.hour).toBe(4);
  expect(worst.hour).toBe(4);
});

it('returns the forecast for that local hour', () => {
  expect(readingAt(smogDay(), 7).pm25).toBe(180);
});

it('falls back to the current hour when the forecast does not reach that hour', () => {
  expect(readingAt([{ hour: 3, pm25: 90 }], 7)).toEqual({ hour: 3, pm25: 90 });
});

it.each([
  [0, '12 midnight'],
  [7, '7 am'],
  [12, '12 noon'],
  [15, '3 pm'],
  [24, '12 midnight'],
  [25, '1 am'],
  [-1, '11 pm'],
])('writes hour %i as %s', (hour, text) => {
  expect(clock(hour)).toBe(text);
});
