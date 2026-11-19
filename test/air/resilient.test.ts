import { describe, expect, it } from 'vitest';
import { cachedAir, cachedGeocoder, fallbackAir, fallbackGeocoder } from '../../src/air/resilient';
import { typicalAir } from '../../src/air/typical';
import type { AirQualityProvider, Geocoder } from '../../src/ports';
import { DELHI, SMOG } from '../support/fixtures';
import {
  brokenAir,
  brokenGeocoder,
  emptyGeocoder,
  fixedClock,
  foundGeocoder,
  memoryCache,
  recordingLogger,
  smogAir,
} from '../support/fakes';

/** A provider that counts how often it is asked. */
function counted(inner: AirQualityProvider): AirQualityProvider & { calls: number } {
  const provider = {
    calls: 0,
    read: (place: Parameters<AirQualityProvider['read']>[0]) => {
      provider.calls++;
      return inner.read(place);
    },
  };
  return provider;
}

describe('cachedAir', () => {
  it('asks upstream once per place and serves the cached report after', async () => {
    const upstream = counted(smogAir);
    const cache = memoryCache();
    const provider = cachedAir(upstream, cache);
    expect(await provider.read(DELHI)).toEqual(SMOG);
    expect(await provider.read({ ...DELHI, latitude: 28.651 })).toEqual(SMOG);
    expect(upstream.calls).toBe(1);
    expect([...cache.ttls.entries()]).toEqual([['air/28.65/77.23', 600]]);
  });

  it('keys by place, so another city is another lookup', async () => {
    const upstream = counted(smogAir);
    const provider = cachedAir(upstream, memoryCache());
    await provider.read(DELHI);
    await provider.read({ ...DELHI, latitude: 19.08, longitude: 72.88 });
    expect(upstream.calls).toBe(2);
  });

  it('treats a cached value of the wrong shape as a miss', async () => {
    const cache = memoryCache();
    cache.entries.set('air/28.65/77.23', { aqi: 'low' });
    const upstream = counted(smogAir);
    expect(await cachedAir(upstream, cache).read(DELHI)).toEqual(SMOG);
    expect(upstream.calls).toBe(1);
  });

  it('does not cache a failure', async () => {
    const cache = memoryCache();
    await expect(cachedAir(brokenAir, cache).read(DELHI)).rejects.toThrow('air down');
    expect(cache.entries.size).toBe(0);
  });
});

describe('fallbackAir', () => {
  it('answers from the primary when it works, without logging', async () => {
    const logger = recordingLogger();
    expect(await fallbackAir(smogAir, brokenAir, logger).read(DELHI)).toEqual(SMOG);
    expect(logger.events).toEqual([]);
  });

  it('answers from the backup when the primary fails, and logs why', async () => {
    const logger = recordingLogger();
    const backup = typicalAir(fixedClock('2026-12-15T04:30:00Z'));
    const report = await fallbackAir(brokenAir, backup, logger).read(DELHI);
    expect(report.source).toBe('typical');
    expect(logger.events).toEqual(['air_provider_failed']);
  });
});

describe('cachedGeocoder', () => {
  function countedGeocoder(inner: Geocoder): Geocoder & { calls: number } {
    const geocoder = {
      calls: 0,
      find: (query: string) => {
        geocoder.calls++;
        return inner.find(query);
      },
    };
    return geocoder;
  }

  it('caches a match, ignoring case, for a day', async () => {
    const upstream = countedGeocoder(foundGeocoder);
    const cache = memoryCache();
    const geocoder = cachedGeocoder(upstream, cache);
    expect(await geocoder.find('Delhi')).toEqual(DELHI);
    expect(await geocoder.find('DELHI')).toEqual(DELHI);
    expect(upstream.calls).toBe(1);
    expect([...cache.ttls.entries()]).toEqual([['place/delhi', 86_400]]);
  });

  it('caches a miss too, so a typo is not looked up again and again', async () => {
    const upstream = countedGeocoder(emptyGeocoder);
    const geocoder = cachedGeocoder(upstream, memoryCache());
    expect(await geocoder.find('zzzz')).toBeNull();
    expect(await geocoder.find('zzzz')).toBeNull();
    expect(upstream.calls).toBe(1);
  });

  it('builds a safe key from anything typed', async () => {
    const cache = memoryCache();
    await cachedGeocoder(foundGeocoder, cache).find('New Delhi/../x');
    expect([...cache.entries.keys()]).toEqual(['place/new%20delhi%2F..%2Fx']);
  });
});

describe('fallbackGeocoder', () => {
  it('uses the backup only when the primary fails', async () => {
    const logger = recordingLogger();
    expect(await fallbackGeocoder(emptyGeocoder, foundGeocoder, logger).find('x')).toBeNull();
    expect(logger.events).toEqual([]);
    expect(await fallbackGeocoder(brokenGeocoder, foundGeocoder, logger).find('x')).toEqual(DELHI);
    expect(logger.events).toEqual(['geocoder_failed']);
  });
});

describe('every AirQualityProvider is substitutable (Liskov)', () => {
  const providers: [string, AirQualityProvider][] = [
    ['fake', smogAir],
    ['typical', typicalAir(fixedClock('2026-12-15T04:30:00Z'))],
    ['cached', cachedAir(smogAir, memoryCache())],
    ['fallback', fallbackAir(brokenAir, smogAir, recordingLogger())],
  ];

  it.each(providers)('%s resolves to a complete, non-empty report', async (_name, provider) => {
    const report = await provider.read(DELHI);
    expect(report.hours.length).toBeGreaterThan(0);
    expect(report.aqi).toBeGreaterThanOrEqual(0);
    expect(['live', 'typical']).toContain(report.source);
  });
});
