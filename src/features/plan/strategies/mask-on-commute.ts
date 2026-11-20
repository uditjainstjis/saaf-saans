/**
 * Routine strategy: wear an N95 on a commute that is spent breathing street
 * air (walking, cycling, two-wheeler, bus). Emissions of the commute itself
 * are ./switch-commute.ts and ./keep-commute.ts.
 */
import { formatNumber as n } from '../../../config/limits';
import type { CommuteMode } from '../../../config/options';
import { type FactorId, FACTORS } from '../../impact/factors';
import { inhaledDose, round1 } from '../../impact/service';
import { type Strategy, impact } from './strategy';

/** How fast and how hard each open-air way of travelling is. */
const OPEN_AIR_TRAVEL: Partial<Record<CommuteMode, { speedId: FactorId; breathingId: FactorId }>> =
  {
    walk: { speedId: 'walkSpeed', breathingId: 'breathingLight' },
    cycle: { speedId: 'cycleSpeed', breathingId: 'breathingActive' },
    two_wheeler: { speedId: 'roadSpeed', breathingId: 'breathingRest' },
    bus: { speedId: 'roadSpeed', breathingId: 'breathingRest' },
  };

/** Wear an N95 on a commute that is spent breathing street air. */
export const maskOnCommute: Strategy = {
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
