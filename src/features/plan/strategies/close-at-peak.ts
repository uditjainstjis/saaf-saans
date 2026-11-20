/**
 * Indoor strategy: shut windows through the dirtiest hours of the day.
 * Airing at the cleanest hour is ./air-at-cleanest-hour.ts.
 */
import { formatNumber as n } from '../../../config/limits';
import { clock } from '../../air-quality/forecast';
import { FACTORS } from '../../impact/factors';
import { inhaledDose } from '../../impact/service';
import { type Strategy, impact } from './strategy';

/** Shut windows through the dirtiest hours of the day. */
export const closeAtPeak: Strategy = {
  id: 'close-at-peak',
  category: 'indoor',
  advise(s) {
    const { worst } = s.outlook;
    if (worst.pm25 <= FACTORS.whoDaily.value) return null;
    const indoorShare = FACTORS[s.infiltrationId].value;
    const rate = FACTORS.breathingRest.value;
    const hours = FACTORS.peakHours.value;
    const pm25 = worst.pm25 * (1 - indoorShare);
    return {
      status: 'new',
      title: `Shut windows from ${clock(worst.hour - 1)} to ${clock(worst.hour + 2)}`,
      action: `PM2.5 peaks near ${n(worst.pm25)} µg/m³ around ${clock(worst.hour)}. Keep doors and windows closed through those hours and skip incense, mosquito coils and frying while they are shut.`,
      impact: impact({ inhaledAvoidedUg: inhaledDose({ pm25, rate, hours, people: s.people }) }),
      calculation: `${n(worst.pm25)} µg/m³ × (1 − ${n(indoorShare)} reaching indoors) × ${n(rate)} m³/h × ${n(hours)} h × ${n(s.people)} people`,
      factorIds: ['breathingRest', 'peakHours', s.infiltrationId, 'whoDaily'],
      when: { hour: worst.hour - 1, minutes: hours * 60 },
    };
  },
};
