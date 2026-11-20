/**
 * Indoor strategy: clean the air of the room people spend their longest
 * stretch in, with a purifier or a box-fan filter. Indoor PM2.5 is outdoor
 * PM2.5 times the share that infiltrates. The room is chosen in ./clean-room.ts.
 */
import { formatNumber as n } from '../../../config/limits';
import { FACTORS } from '../../impact/factors';
import { cleanerReduction, inhaledDose, round1 } from '../../impact/service';
import { cleanRoom } from './clean-room';
import { type Strategy, impact } from './strategy';

/** Clean the air of the room people spend the longest stretch in. */
export const cleanAirRoom: Strategy = {
  id: 'clean-air-room',
  category: 'indoor',
  advise(s) {
    const room = cleanRoom(s);
    const indoor = s.air.pm25 * FACTORS[s.infiltrationId].value;
    const removed = cleanerReduction(
      FACTORS[room.cadrId].value,
      FACTORS[room.volumeId].value,
      FACTORS.naturalLoss.value,
    );
    const rate = FACTORS[room.breathingId].value;
    const hours = FACTORS[room.hoursId].value;
    const dose = inhaledDose({ pm25: indoor * removed, rate, hours, people: room.people });
    return {
      status: 'new',
      title: room.title,
      action: room.action,
      impact: impact({ inhaledAvoidedUg: dose }),
      calculation: `${n(round1(indoor))} µg/m³ indoors × ${n(round1(removed * 100))}% removed × ${n(rate)} m³/h × ${n(hours)} h × ${n(room.people)} people`,
      factorIds: [
        room.cadrId,
        room.volumeId,
        room.hoursId,
        room.breathingId,
        'naturalLoss',
        s.infiltrationId,
      ],
    };
  },
};
