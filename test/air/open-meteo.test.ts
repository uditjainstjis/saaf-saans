import { describe, expect, it } from 'vitest';
import { openMeteoAir, openMeteoGeocoder } from '../../src/air/open-meteo';
import type { HttpGet } from '../../src/ports';
import { DELHI } from '../support/fixtures';
import { jsonGet } from '../support/fakes';

/** A reply in the shape the Open-Meteo Air Quality API returned for Delhi on 2026-11-20, shortened to three hours. */
const AIR_REPLY = {
  latitude: 28.7,
  longitude: 77.2,
  timezone: 'Asia/Kolkata',
  current: {
    time: '2026-11-20T03:30',
    us_aqi: 186,
    pm2_5: 149.0,
    pm10: 149.5,
    us_aqi_pm2_5: 186,
    us_aqi_pm10: 76,
    us_aqi_nitrogen_dioxide: 27,
    us_aqi_ozone: 14,
    us_aqi_sulphur_dioxide: 17,
  },
  hourly: {
    time: ['2026-11-20T03:00', '2026-11-20T04:00', '2026-11-20T15:00'],
    pm2_5: [149.0, null, 59.8],
  },
};

describe('openMeteoAir', () => {
  it('reads AQI, PM2.5, PM10, the dominant pollutant and the hourly forecast', async () => {
    const get = jsonGet(AIR_REPLY);
    const report = await openMeteoAir(get).read(DELHI);
    expect(report).toEqual({
      source: 'live',
      aqi: 186,
      pm25: 149,
      pm10: 149.5,
      dominant: 'pm2_5',
      hours: [
        { hour: 3, pm25: 149 },
        { hour: 15, pm25: 59.8 },
      ],
    });
  });

  it('asks for the place, 24 forecast hours and local time, and nothing identifying', async () => {
    const get = jsonGet(AIR_REPLY);
    await openMeteoAir(get).read(DELHI);
    const url = new URL(get.urls[0] ?? '');
    expect(url.origin).toBe('https://air-quality-api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('28.650');
    expect(url.searchParams.get('longitude')).toBe('77.230');
    expect(url.searchParams.get('forecast_hours')).toBe('24');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('current')).toContain('us_aqi_ozone');
  });

  it('names whichever pollutant has the highest sub-index, skipping missing ones', async () => {
    const current = { ...AIR_REPLY.current, us_aqi_pm2_5: null, us_aqi_ozone: 140 };
    const report = await openMeteoAir(jsonGet({ ...AIR_REPLY, current })).read(DELHI);
    expect(report.dominant).toBe('ozone');
  });

  it('rejects an error status, a malformed reply and a forecast with no readings', async () => {
    await expect(openMeteoAir(jsonGet({}, 503)).read(DELHI)).rejects.toThrow('503');
    await expect(openMeteoAir(jsonGet({ current: {} })).read(DELHI)).rejects.toThrow();
    const empty = { ...AIR_REPLY, hourly: { time: ['2026-11-20T03:00'], pm2_5: [null] } };
    await expect(openMeteoAir(jsonGet(empty)).read(DELHI)).rejects.toThrow();
  });

  it('rejects a negative concentration rather than planning from it', async () => {
    const current = { ...AIR_REPLY.current, pm2_5: -4 };
    await expect(openMeteoAir(jsonGet({ ...AIR_REPLY, current })).read(DELHI)).rejects.toThrow();
  });

  it('gives up on a slow upstream at the timeout, and cancels the call', async () => {
    let aborted = false;
    const hung: HttpGet = (_url, signal) =>
      new Promise<Response>(() => {
        signal.addEventListener('abort', () => (aborted = true));
      });
    await expect(openMeteoAir(hung, 5).read(DELHI)).rejects.toThrow('exceeded 5ms');
    expect(aborted).toBe(true);
  });
});

describe('openMeteoGeocoder', () => {
  const HIT = {
    name: 'Delhi',
    latitude: 28.65195,
    longitude: 77.23149,
    country: 'India',
    admin1: 'National Capital Territory of Delhi',
  };

  it('returns the top match with its region', async () => {
    const get = jsonGet({ results: [HIT, { ...HIT, name: 'Delhi, NY' }] });
    expect(await openMeteoGeocoder(get).find('Delhi')).toEqual({
      name: 'Delhi',
      region: 'National Capital Territory of Delhi, India',
      latitude: 28.65195,
      longitude: 77.23149,
    });
    const url = new URL(get.urls[0] ?? '');
    expect(url.origin).toBe('https://geocoding-api.open-meteo.com');
    expect(url.searchParams.get('name')).toBe('Delhi');
    expect(url.searchParams.get('count')).toBe('1');
  });

  it('copes with a match that has no region', async () => {
    const get = jsonGet({ results: [{ name: 'Atlantis', latitude: 0, longitude: 0 }] });
    expect((await openMeteoGeocoder(get).find('Atlantis'))?.region).toBe('');
  });

  it('returns null when nothing matches, as the API signals by omitting results', async () => {
    expect(await openMeteoGeocoder(jsonGet({ generationtime_ms: 0.2 })).find('zzzz')).toBeNull();
  });

  it('URL-encodes whatever was typed', async () => {
    const get = jsonGet({});
    await openMeteoGeocoder(get).find('a&b=c #d');
    expect(get.urls[0]).toContain('name=a%26b%3Dc+%23d');
  });

  it('rejects an error status', async () => {
    await expect(openMeteoGeocoder(jsonGet({}, 500)).find('Delhi')).rejects.toThrow('500');
  });
});
