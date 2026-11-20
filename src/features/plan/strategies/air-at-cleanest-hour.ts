/**
 * Routine strategy: air rooms at the cleanest hour of the day instead of
 * first thing in the morning. Keeping windows shut at the peak is
 * ./close-at-peak.ts.
 */
import { formatNumber as n } from '../../../config/limits';
import { OUTDOOR_HOUR } from '../../../config/options';
import { clock, readingAt } from '../../air-quality/forecast';
import { FACTORS } from '../../impact/factors';
import { inhaledDose } from '../../impact/service';
import { type Strategy, impact } from './strategy';

/** Air rooms at the cleanest hour instead of first thing in the morning. */
export const airAtCleanestHour: Strategy = {
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
