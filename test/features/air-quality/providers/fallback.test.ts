/**
 * Tests for the fallback decorators: the backup answers only when the primary
 * rejects, and the failure is logged.
 */
import { expect, it } from 'vitest';
import {
  fallbackAir,
  fallbackGeocoder,
} from '../../../../src/features/air-quality/providers/fallback';
import { typicalAir } from '../../../../src/features/air-quality/providers/typical-air';
import {
  brokenAir,
  brokenGeocoder,
  emptyGeocoder,
  fixedClock,
  foundGeocoder,
  recordingLogger,
  smogAir,
} from '../../../support/fakes';
import { DELHI, SMOG } from '../../../support/fixtures';

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

it('uses the backup only when the primary fails', async () => {
  const logger = recordingLogger();
  expect(await fallbackGeocoder(emptyGeocoder, foundGeocoder, logger).find('x')).toBeNull();
  expect(logger.events).toEqual([]);
  expect(await fallbackGeocoder(brokenGeocoder, foundGeocoder, logger).find('x')).toEqual(DELHI);
  expect(logger.events).toEqual(['geocoder_failed']);
});
