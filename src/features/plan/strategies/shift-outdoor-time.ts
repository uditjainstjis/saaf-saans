/**
 * Routine strategy: move exercise, play or assembly to the cleanest hour, when
 * that hour is clean enough. Its counterpart for dirtier days is
 * ./exercise-indoors.ts.
 */
import { formatNumber as n } from '../../../config/limits';
import { clock } from '../../air-quality/forecast';
import { FACTORS } from '../../impact/factors';
import { inhaledDose } from '../../impact/service';
import { outdoorSession } from './outdoor-session';
import { type Strategy, audience, impact } from './strategy';

/** Move exercise, play or assembly to the cleanest hour, when that hour is clean enough. */
export const shiftOutdoorTime: Strategy = {
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
      when: { hour: best.hour, minutes: s.profile.outdoorMinutes },
    };
  },
};
