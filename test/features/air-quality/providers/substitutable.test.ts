/**
 * Liskov check: every AirQualityProvider, real or fake, wrapped or not, honours
 * the same contract.
 */
import { expect, it } from 'vitest';
import { cachedAir } from '../../../../src/features/air-quality/providers/cached';
import { fallbackAir } from '../../../../src/features/air-quality/providers/fallback';
import { typicalAir } from '../../../../src/features/air-quality/providers/typical-air';
import type { AirQualityProvider } from '../../../../src/features/air-quality/types';
import {
  brokenAir,
  fixedClock,
  memoryCache,
  recordingLogger,
  smogAir,
} from '../../../support/fakes';
import { DELHI } from '../../../support/fixtures';

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
