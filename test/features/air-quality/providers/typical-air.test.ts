/**
 * Tests for the offline air provider: typical values marked as such, shaped
 * over a day from the injected clock.
 */
import { expect, it } from 'vitest';
import { outlookFor } from '../../../../src/features/air-quality/forecast';
import { typicalAir } from '../../../../src/features/air-quality/providers/typical-air';
import { airReportSchema } from '../../../../src/features/air-quality/schemas';
import { fixedClock } from '../../../support/fakes';
import { DELHI } from '../../../support/fixtures';

// 04:30 UTC is 09:30 in India; solar time at 77°E rounds to UTC+5, hour 9.
const provider = typicalAir(fixedClock('2026-12-15T04:30:00Z'));

it('reports typical values, marked as such, for 24 hours from the local hour', async () => {
  const report = await provider.read(DELHI);
  expect(airReportSchema.parse(report)).toEqual(report);
  expect(report.source).toBe('typical');
  expect(report.dominant).toBe('pm2_5');
  expect(report.hours).toHaveLength(24);
  expect(report.hours[0].hour).toBe(9);
  expect(report.hours[23]?.hour).toBe(8);
  expect(report.pm25).toBe(report.hours[0].pm25);
  expect(report.pm10).toBe(Math.round(report.pm25 * 1.5));
});

it('shapes the day: cleanest mid-afternoon, dirtiest in the small hours', async () => {
  const { best, worst } = outlookFor((await provider.read(DELHI)).hours);
  expect(best).toEqual({ hour: 15, pm25: 108 });
  expect(worst).toEqual({ hour: 3, pm25: 252 });
});

it('uses a middling default for a place it does not know', async () => {
  const report = await provider.read({ ...DELHI, name: 'Springfield' });
  expect(outlookFor(report.hours).best.pm25).toBe(60);
});

it('keeps the local hour in range west of Greenwich', async () => {
  const west = typicalAir(fixedClock('2026-12-15T02:00:00Z'));
  const report = await west.read({ ...DELHI, name: 'Lima', longitude: -77 });
  expect(report.hours[0].hour).toBe(21);
});
