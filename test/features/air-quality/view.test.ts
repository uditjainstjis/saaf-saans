/**
 * Tests for the air view: the band in words and symbol, the pollutant's name
 * and clock times, composed for the page.
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
