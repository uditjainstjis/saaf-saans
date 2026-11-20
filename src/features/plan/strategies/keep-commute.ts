/**
 * Alternative strategy: credit what an already low-emission commute saves
 * compared with driving, so a good choice is seen and kept. Drivers get
 * ./switch-commute.ts.
 */
import { LABELS } from '../../../config/labels';
import { formatNumber as n } from '../../../config/limits';
import type { CommuteMode } from '../../../config/options';
import { FACTORS } from '../../impact/factors';
import { commuteFactors, commuteKm } from './commute';
import { type Strategy, audience, impact } from './strategy';

/** Emissions per kilometre of the ways to commute that are already low-emission. */
const LOW_EMISSION: Partial<Record<CommuteMode, number>> = {
  walk: 0,
  cycle: 0,
  bus: FACTORS.busCo2e.value,
  metro: FACTORS.metroCo2e.value,
};

/** Show what an already low-emission commute is saving compared with driving. */
export const keepCommute: Strategy = {
  id: 'keep-commute',
  category: 'alternative',
  advise(s) {
    const own = LOW_EMISSION[s.profile.commute];
    const km = commuteKm(s);
    if (own === undefined || km === 0) return null;
    const perKm = FACTORS.carCo2e.value - own;
    return {
      status: 'keep',
      title: 'Keep your low-emission commute',
      action: `Travelling by ${LABELS.commute[s.profile.commute].toLowerCase()} already keeps ${audience(s)} out of a car. Hold on to it through winter, when traffic exhaust is trapped closest to the ground.`,
      impact: impact({ co2eSavedKg: km * perKm }),
      calculation: `${n(km)} km a week by ${n(s.travellers)} commuters × (${n(FACTORS.carCo2e.value)} − ${n(own)}) kg CO2e/km compared with a petrol car`,
      factorIds: ['carCo2e', 'busCo2e', 'metroCo2e', ...commuteFactors(s)],
    };
  },
};
