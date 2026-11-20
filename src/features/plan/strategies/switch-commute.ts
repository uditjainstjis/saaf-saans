/**
 * Alternative strategy: swap a solo car or scooter commute for the metro,
 * and report the greenhouse gas that saves. People already travelling cleanly
 * get ./keep-commute.ts.
 */
import { LABELS } from '../../../config/labels';
import { formatNumber as n } from '../../../config/limits';
import type { CommuteMode } from '../../../config/options';
import { type FactorId, FACTORS } from '../../impact/factors';
import { commuteFactors, commuteKm } from './commute';
import { type Strategy, impact } from './strategy';

/** Emissions per kilometre of the motorised ways to commute alone. */
const DRIVEN: Partial<Record<CommuteMode, FactorId>> = {
  car: 'carCo2e',
  two_wheeler: 'twoWheelerCo2e',
};

/** Swap a solo car or scooter commute for the metro. */
export const switchCommute: Strategy = {
  id: 'switch-commute',
  category: 'alternative',
  advise(s) {
    const drivenId = DRIVEN[s.profile.commute];
    const km = commuteKm(s);
    if (!drivenId || km === 0) return null;
    const perKm = FACTORS[drivenId].value - FACTORS.metroCo2e.value;
    return {
      status: 'new',
      title: 'Take the metro instead of driving',
      action: `Swap the ${LABELS.commute[s.profile.commute].toLowerCase()} commute for metro or train, with a walk, cycle or shared e-rickshaw for the last stretch. A shared car with every seat filled is the next best choice.`,
      impact: impact({ co2eSavedKg: km * perKm }),
      calculation: `${n(km)} km a week by ${n(s.travellers)} commuters × (${n(FACTORS[drivenId].value)} − ${n(FACTORS.metroCo2e.value)}) kg CO2e/km`,
      factorIds: [drivenId, 'metroCo2e', ...commuteFactors(s)],
    };
  },
};
