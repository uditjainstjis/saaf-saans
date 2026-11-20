import { describe, expect, it } from 'vitest';
import {
  adviceFor,
  aqiFromPm25,
  bandFor,
  POLLUTANT_LABEL,
} from '../../../src/features/air-quality/aqi';
import { POLLUTANTS } from '../../../src/features/plan/types';

describe('bandFor', () => {
  it.each([
    [0, 'Good'],
    [50, 'Good'],
    [51, 'Moderate'],
    [100, 'Moderate'],
    [101, 'Unhealthy for sensitive groups'],
    [150, 'Unhealthy for sensitive groups'],
    [151, 'Unhealthy'],
    [200, 'Unhealthy'],
    [201, 'Very unhealthy'],
    [300, 'Very unhealthy'],
    [301, 'Hazardous'],
    [999, 'Hazardous'],
  ])('puts AQI %i in the AirNow category %s', (aqi, label) => {
    expect(bandFor(aqi).label).toBe(label);
  });

  it('gives every band a distinct symbol, so severity never rests on colour', () => {
    const symbols = [0, 51, 101, 151, 201, 301].map((aqi) => bandFor(aqi).symbol);
    expect(new Set(symbols).size).toBe(6);
  });
});

describe('adviceFor', () => {
  it('is stricter for sensitive people in the same air', () => {
    const band = bandFor(160);
    expect(adviceFor(band, false)).toContain('Everyone');
    expect(adviceFor(band, true)).toContain('Children, elders');
  });
});

describe('aqiFromPm25', () => {
  it.each([
    [0, 0],
    [9, 50],
    [35.4, 100],
    [55.4, 150],
    [125.4, 200],
    [225.4, 300],
    [325.4, 500],
    [22.2, 75],
  ])('maps %f µg/m³ to US AQI %i on the EPA breakpoints', (pm25, aqi) => {
    expect(aqiFromPm25(pm25)).toBe(aqi);
  });

  it('caps at 500 above the scale', () => {
    expect(aqiFromPm25(900)).toBe(500);
  });
});

describe('POLLUTANT_LABEL', () => {
  it('names every pollutant', () => {
    for (const pollutant of POLLUTANTS) expect(POLLUTANT_LABEL[pollutant]).not.toBe('');
  });
});
