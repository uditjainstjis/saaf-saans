/**
 * Indoor strategy: seal the door and window gaps smog leaks in through.
 * A home-only hack; groups get ./clean-air-room.ts instead.
 */
import { formatNumber as n } from '../../../config/limits';
import { FACTORS } from '../../impact/factors';
import { inhaledDose } from '../../impact/service';
import { type Strategy, audience, impact } from './strategy';

/** Seal the gaps smog leaks in through. A home-only hack. */
export const sealGaps: Strategy = {
  id: 'seal-gaps',
  category: 'indoor',
  advise(s) {
    if (s.profile.mode !== 'family' || s.air.pm25 <= FACTORS.whoDaily.value) return null;
    const indoorShare = FACTORS[s.infiltrationId].value;
    const gain = FACTORS.sealingGain.value;
    const rate = FACTORS.breathingRest.value;
    const hours = FACTORS.hoursAtHome.value;
    const pm25 = s.air.pm25 * indoorShare * gain;
    return {
      status: 'new',
      title: 'Seal door and window gaps',
      action: `Roll a damp towel along the bottom of outside doors and press foam tape or old cloth into rattling window frames, so less outdoor air reaches ${audience(s)}.`,
      impact: impact({ inhaledAvoidedUg: inhaledDose({ pm25, rate, hours, people: s.people }) }),
      calculation: `${n(s.air.pm25)} µg/m³ × ${n(indoorShare)} reaching indoors × ${n(gain)} cut × ${n(rate)} m³/h × ${n(hours)} h × ${n(s.people)} people`,
      factorIds: ['sealingGain', 'breathingRest', 'hoursAtHome', s.infiltrationId, 'whoDaily'],
    };
  },
};
