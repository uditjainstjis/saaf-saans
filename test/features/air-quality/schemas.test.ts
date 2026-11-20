/**
 * Tests for the air report's shape as it arrives from an adapter or the
 * cache: the time of the reading is kept when it is a real local date and
 * time, and dropped, never trusted, when it is not.
 */
import { expect, it } from 'vitest';
import { airReportSchema } from '../../../src/features/air-quality/schemas';
import { SMOG } from '../../support/fixtures';

it('keeps the local date and time the reading was taken', () => {
  expect(airReportSchema.parse(SMOG).observedAt).toBe('2026-11-20T15:45');
  expect(airReportSchema.parse({ ...SMOG, observedAt: '2026-11-20T03:30:00' }).observedAt).toBe(
    '2026-11-20T03:30:00',
  );
});

it('keeps the report and drops a time that is missing or not a real local time', () => {
  const untrusted = [
    undefined,
    '2026-11-20T24:00',
    '2026-02-30T03:30',
    '2026-11-20T03:30Z',
    '3 pm',
    1530,
  ];
  for (const observedAt of untrusted) {
    const report = airReportSchema.parse({ ...SMOG, observedAt });
    expect(report.aqi).toBe(186);
    expect(report.local).toEqual(SMOG.local);
    expect(report.observedAt).toBeUndefined();
  }
});
