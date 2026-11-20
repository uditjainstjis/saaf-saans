/**
 * Tests for the air view: the band in words and symbol, the pollutant's name,
 * clock times and the time of the reading, composed for the page.
 */
import { expect, it } from 'vitest';
import { airView } from '../../../src/features/air-quality/view';
import { SMOG } from '../../support/fixtures';

it('names the band, the dominant pollutant and the best and worst hours', () => {
  const view = airView(SMOG);
  expect(view.band).toEqual({ key: 'unhealthy', label: 'Unhealthy', symbol: '◕' });
  expect(view.dominant).toBe('PM2.5 (fine particles)');
  expect(view.best).toEqual({ time: '3 pm', pm25: 30 });
  expect(view.worst).toEqual({ time: '10 pm', pm25: 220 });
});

it('lists every forecast hour as a clock time, and keeps the source', () => {
  const view = airView({ ...SMOG, source: 'typical' });
  expect(view.hours).toHaveLength(24);
  expect(view.hours[7]).toEqual({ time: '7 am', pm25: 180 });
  expect(view.source).toBe('typical');
});

it('says when the reading was taken, in the place’s local time', () => {
  expect(airView(SMOG).takenAt).toBe('3:45 pm on 20 Nov');
  const at = (observedAt: string) => airView({ ...SMOG, observedAt }).takenAt;
  expect(at('2026-01-05T00:15')).toBe('12:15 am on 5 Jan');
  expect(at('2026-12-31T12:00')).toBe('12:00 pm on 31 Dec');
  expect(at('2026-09-09T09:05')).toBe('9:05 am on 9 Sep');
});

it('says nothing about the time when the report does not carry one', () => {
  expect(airView({ ...SMOG, observedAt: undefined })).not.toHaveProperty('takenAt');
});
