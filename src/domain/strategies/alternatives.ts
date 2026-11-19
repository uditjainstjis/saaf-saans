import { LABELS, formatNumber as n, type CommuteMode } from '../../shared/constants';
import { round1, weeklyKm } from '../exposure';
import { FACTORS, type FactorId } from '../factors';
import type { Situation } from '../situation';
import { audience, impact, type Strategy } from './strategy';

/**
 * Sustainable alternatives: swaps that cut what a household or group emits,
 * not only what it breathes. Each reports the greenhouse gas or the PM2.5 that
 * stops being put into the neighbourhood's air.
 */

/** Emissions per kilometre of the motorised ways to commute alone. */
const DRIVEN: Partial<Record<CommuteMode, FactorId>> = {
  car: 'carCo2e',
  two_wheeler: 'twoWheelerCo2e',
};

/** Emissions per kilometre of the ways to commute that are already low-emission. */
const LOW_EMISSION: Partial<Record<CommuteMode, number>> = {
  walk: 0,
  cycle: 0,
  bus: FACTORS.busCo2e.value,
  metro: FACTORS.metroCo2e.value,
};

/** Kilometres the profile's commuters travel in a week. */
const commuteKm = (s: Situation): number =>
  weeklyKm({
    oneWayKm: s.profile.commuteKm,
    daysPerWeek: FACTORS.commuteDays.value,
    travellers: s.travellers,
  });

/** The factors every commute calculation uses, for this kind of profile. */
const commuteFactors = (s: Situation): FactorId[] =>
  s.profile.mode === 'family' ? ['commuteDays'] : ['commuteDays', 'groupUptake'];

/** Swap a solo car or scooter commute for the metro. */
const switchCommute: Strategy = {
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

/** Show what an already low-emission commute is saving compared with driving. */
const keepCommute: Strategy = {
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

/** Replace a wood, dung or coal stove with a clean one. */
const cleanCooking: Strategy = {
  id: 'clean-cooking',
  category: 'alternative',
  advise(s) {
    if (s.profile.mode !== 'family' || s.profile.cookingFuel !== 'biomass') return null;
    const kg = FACTORS.woodPerDay.value * 7;
    return {
      status: 'new',
      title: 'Cook on LPG or induction',
      action:
        'Move daily cooking to LPG, piped gas or an induction plate, starting with the longest-simmering dishes. Until then, cook near an open window with the exhaust fan on and keep children out of the kitchen.',
      impact: impact({ notEmittedG: kg * FACTORS.woodCookPm.value }),
      calculation: `${n(FACTORS.woodPerDay.value)} kg of fuel a day × 7 days × ${n(FACTORS.woodCookPm.value)} g PM2.5 per kg`,
      factorIds: ['woodPerDay', 'woodCookPm'],
    };
  },
};

/** End open burning of waste and leaves in a neighbourhood. */
const stopWasteBurning: Strategy = {
  id: 'stop-waste-burning',
  category: 'alternative',
  advise(s) {
    if (s.profile.mode !== 'community' || !s.profile.wasteBurning) return null;
    const kg = (FACTORS.wastePerHundred.value * s.people * 7) / 100;
    return {
      status: 'new',
      title: 'Compost leaves and waste instead of burning them',
      action:
        'Set up a shared compost pit for leaves and kitchen waste, hand dry waste to the municipal collector, and give night guards a heater or blankets so nobody needs a bonfire.',
      impact: impact({
        notEmittedG: kg * FACTORS.wasteBurnPm.value,
        co2eSavedKg: kg * FACTORS.wasteBurnCo2.value,
      }),
      calculation: `${n(round1(kg))} kg burned a week × ${n(FACTORS.wasteBurnPm.value)} g PM2.5 per kg, and × ${n(FACTORS.wasteBurnCo2.value)} kg CO2 per kg`,
      factorIds: ['wastePerHundred', 'wasteBurnPm', 'wasteBurnCo2'],
    };
  },
};

/** The alternative strategies, in the order the page lists them. */
export const ALTERNATIVE_STRATEGIES: readonly Strategy[] = [
  switchCommute,
  keepCommute,
  cleanCooking,
  stopWasteBurning,
];
