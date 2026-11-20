/**
 * Alternative strategy: replace a wood, dung or coal stove with LPG or
 * induction, and report the PM2.5 that stops being emitted. Households only.
 */
import { formatNumber as n } from '../../../config/limits';
import { FACTORS } from '../../impact/factors';
import { type Strategy, impact } from './strategy';

/** Replace a wood, dung or coal stove with a clean one. */
export const cleanCooking: Strategy = {
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
