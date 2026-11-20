/**
 * Routine strategy: take the outdoor session indoors when even the cleanest
 * hour is over the limit for this audience. Its counterpart for cleaner days
 * is ./shift-outdoor-time.ts.
 */
import { formatNumber as n } from '../../../config/limits';
import { clock } from '../../air-quality/forecast';
import { FACTORS } from '../../impact/factors';
import { inhaledDose } from '../../impact/service';
import { outdoorSession } from './outdoor-session';
import { type Strategy, impact } from './strategy';

/** Take the session indoors when even the cleanest hour is over the limit. */
export const exerciseIndoors: Strategy = {
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
