/**
 * Alternative strategy: end open burning of waste and leaves in a
 * neighbourhood, and report the PM2.5 and CO2 that stops being emitted.
 * Communities only.
 */
import { formatNumber as n } from '../../../config/limits';
import { FACTORS } from '../../impact/factors';
import { round1 } from '../../impact/service';
import { type Strategy, impact } from './strategy';

/** End open burning of waste and leaves in a neighbourhood. */
export const stopWasteBurning: Strategy = {
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
