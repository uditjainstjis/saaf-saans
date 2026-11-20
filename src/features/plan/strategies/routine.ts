import { OUTDOOR_HOUR, formatNumber as n, type CommuteMode } from '../../../config/constants';
import { inhaledDose, round1 } from '../../impact/service';
import { FACTORS, type FactorId } from '../../impact/factors';
import { clock, readingAt } from '../../air-quality/forecast';
import type { Situation } from '../situation';
import type { HourReading } from '../types';
import { audience, impact, type Strategy } from './strategy';

/**
 * Low-emission daily routines: the same day, re-timed and protected. Each
 * strategy compares what the profile says people do now with a cleaner way of
 * doing it, and reports the PM2.5 that change keeps out of their lungs.
 */

/** A regular outdoor session: its length, and the air at the usual and the cleanest hour. */
interface OutdoorSession {
  hours: number;
  usual: HourReading;
  best: HourReading;
  /** PM2.5 above which this audience should not exert outdoors at all. */
  limit: number;
  limitId: FactorId;
}

/** The profile's outdoor session, or null when there is none. */
function outdoorSession(s: Situation): OutdoorSession | null {
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

/** Move exercise, play or assembly to the cleanest hour, when that hour is clean enough. */
const shiftOutdoorTime: Strategy = {
  id: 'shift-outdoor-time',
  category: 'routine',
  advise(s) {
    const session = outdoorSession(s);
    if (!session || session.best.pm25 > session.limit) return null;
    const { hours, usual, best } = session;
    if (usual.pm25 <= best.pm25) return null;
    const rate = FACTORS.breathingActive.value;
    const saved = inhaledDose({ pm25: usual.pm25 - best.pm25, rate, hours, people: s.people });
    return {
      status: 'new',
      title: `Move outdoor time to ${clock(best.hour)}`,
      action: `Shift ${audience(s)}’s ${s.profile.outdoorMinutes}-minute outdoor session from around ${clock(usual.hour)} to ${clock(best.hour)}, the cleanest hour of the next day.`,
      impact: impact({ inhaledAvoidedUg: saved }),
      calculation: `(${n(usual.pm25)} − ${n(best.pm25)} µg/m³) × ${n(rate)} m³/h × ${n(hours)} h × ${n(s.people)} people`,
      factorIds: ['breathingActive'],
    };
  },
};

/** Take the session indoors when even the cleanest hour is over the limit. */
const exerciseIndoors: Strategy = {
  id: 'exercise-indoors',
  category: 'routine',
  advise(s) {
    const session = outdoorSession(s);
    if (!session || session.best.pm25 <= session.limit) return null;
    const { hours, usual, best, limit, limitId } = session;
    const rate = FACTORS.breathingActive.value;
    const indoorShare = FACTORS[s.infiltrationId].value;
    const pm25 = usual.pm25 * (1 - indoorShare);
    return {
      status: 'new',
      title: 'Take today’s outdoor session indoors',
      action: `Even the cleanest hour (${n(best.pm25)} µg/m³ at ${clock(best.hour)}) is above the ${n(limit)} µg/m³ limit. Swap the ${s.profile.outdoorMinutes}-minute session for indoor activity with windows shut: yoga, skipping or stairs.`,
      impact: impact({ inhaledAvoidedUg: inhaledDose({ pm25, rate, hours, people: s.people }) }),
      calculation: `${n(usual.pm25)} µg/m³ × (1 − ${n(indoorShare)} reaching indoors) × ${n(rate)} m³/h × ${n(hours)} h × ${n(s.people)} people`,
      factorIds: ['breathingActive', s.infiltrationId, limitId],
    };
  },
};

/** How fast and how hard each open-air way of travelling is. */
const OPEN_AIR_TRAVEL: Partial<Record<CommuteMode, { speedId: FactorId; breathingId: FactorId }>> =
  {
    walk: { speedId: 'walkSpeed', breathingId: 'breathingLight' },
    cycle: { speedId: 'cycleSpeed', breathingId: 'breathingActive' },
    two_wheeler: { speedId: 'roadSpeed', breathingId: 'breathingRest' },
    bus: { speedId: 'roadSpeed', breathingId: 'breathingRest' },
  };

/** Wear an N95 on a commute that is spent breathing street air. */
const maskOnCommute: Strategy = {
  id: 'mask-on-commute',
  category: 'routine',
  advise(s) {
    const travel = OPEN_AIR_TRAVEL[s.profile.commute];
    const { pm25 } = s.air;
    if (!travel || s.profile.commuteKm === 0 || pm25 <= FACTORS.whoDaily.value) return null;
    const hours = (s.profile.commuteKm * 2) / FACTORS[travel.speedId].value;
    const rate = FACTORS[travel.breathingId].value;
    const filtered = FACTORS.n95Filter.value * FACTORS.maskFit.value;
    const dose = inhaledDose({ pm25, rate, hours, people: s.travellers });
    return {
      status: 'new',
      title: 'Wear a well-fitted N95 mask on the commute',
      action: `Street air is at ${n(pm25)} µg/m³. A snug N95 for the ${n(round1(hours))} hours a day each commuter spends travelling filters most of it; cloth and surgical masks do not.`,
      impact: impact({ inhaledAvoidedUg: dose * filtered }),
      calculation: `${n(pm25)} µg/m³ × ${n(rate)} m³/h × ${n(round1(hours))} h × ${n(s.travellers)} commuters × ${n(FACTORS.n95Filter.value)} filtration × ${n(FACTORS.maskFit.value)} fit`,
      factorIds: [travel.speedId, travel.breathingId, 'n95Filter', 'maskFit', 'whoDaily'],
    };
  },
};

/** Air rooms at the cleanest hour instead of first thing in the morning. */
const airAtCleanestHour: Strategy = {
  id: 'air-at-cleanest-hour',
  category: 'routine',
  advise(s) {
    const usual = readingAt(s.air.hours, OUTDOOR_HOUR.morning);
    const { best } = s.outlook;
    if (usual.pm25 <= best.pm25) return null;
    const rate = FACTORS.breathingRest.value;
    const hours = FACTORS.airingHours.value;
    const saved = inhaledDose({ pm25: usual.pm25 - best.pm25, rate, hours, people: s.people });
    return {
      status: 'new',
      title: `Open windows at ${clock(best.hour)}, not at dawn`,
      action: `Air rooms for half an hour around ${clock(best.hour)} (${n(best.pm25)} µg/m³) instead of ${clock(usual.hour)} (${n(usual.pm25)} µg/m³), and dust with a damp cloth while they are open.`,
      impact: impact({ inhaledAvoidedUg: saved }),
      calculation: `(${n(usual.pm25)} − ${n(best.pm25)} µg/m³) × ${n(rate)} m³/h × ${n(hours)} h × ${n(s.people)} people`,
      factorIds: ['breathingRest', 'airingHours'],
    };
  },
};

/** The routine strategies, in the order the page lists them. */
export const ROUTINE_STRATEGIES: readonly Strategy[] = [
  shiftOutdoorTime,
  exerciseIndoors,
  maskOnCommute,
  airAtCleanestHour,
];
