/**
 * Tests for the live air adapter, against a reply in the shape Open-Meteo
 * returned for Delhi on 2026-11-20 (shortened to three hours).
 */
import { expect, it } from 'vitest';
import { openMeteoAir } from '../../../../src/features/air-quality/providers/open-meteo-air';
import type { HttpGet } from '../../../../src/lib/ports';
import { jsonGet } from '../../../support/fakes';
import { DELHI } from '../../../support/fixtures';

/** Open-Meteo's air quality reply for Delhi on 2026-11-20, cut to three hours. */
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
    local: { timeZone: 'Asia/Kolkata', date: '2026-11-20' },
    observedAt: '2026-11-20T03:30',
  });
});

it('keeps the report and drops the local day when the zone or the date cannot be trusted', async () => {
  const hourly = { ...AIR_REPLY.hourly, time: ['2026-02-30T03:00', '', '2026-02-30T15:00'] };
  const untrusted = [
    { ...AIR_REPLY, timezone: undefined },
    { ...AIR_REPLY, timezone: 'Asia/Kolkata&add=x@example.com' },
    { ...AIR_REPLY, timezone: 'A'.repeat(65) },
    { ...AIR_REPLY, hourly },
  ];
  for (const reply of untrusted) {
    const report = await openMeteoAir(jsonGet(reply)).read(DELHI);
    expect(report.aqi).toBe(186);
    expect(report.local).toBeUndefined();
  }
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
