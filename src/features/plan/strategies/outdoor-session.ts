/**
 * The outdoor session a profile describes: how long it is, the air at the
 * usual and the cleanest hour, and the limit for this audience. Shared by
 * ./shift-outdoor-time.ts and ./exercise-indoors.ts.
 */

import { OUTDOOR_HOUR } from '../../../config/options';
import { readingAt } from '../../air-quality/forecast';
import type { HourReading } from '../../air-quality/types';
import { type FactorId, FACTORS } from '../../impact/factors';
import type { Situation } from '../types';

/** A regular outdoor session: its length, and the air at the usual and the cleanest hour. */
export interface OutdoorSession {
  hours: number;
  usual: HourReading;
  best: HourReading;
  /** PM2.5 above which this audience should not exert outdoors at all. */
  limit: number;
  limitId: FactorId;
}

/** The profile's outdoor session, or null when there is none. */
export function outdoorSession(s: Situation): OutdoorSession | null {
  const { outdoorTime, outdoorMinutes } = s.profile;
  if (outdoorTime === 'none' || outdoorMinutes === 0) return null;
  const limitId = s.vulnerable ? 'sensitiveLimit' : 'generalLimit';
  return {
    hours: outdoorMinutes / 60,
    usual: readingAt(s.air.hours, OUTDOOR_HOUR[outdoorTime]),
    best: s.outlook.best,
    limit: FACTORS[limitId].value,
    limitId,
  };
}
