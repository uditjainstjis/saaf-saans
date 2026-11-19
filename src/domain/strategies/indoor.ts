import { formatNumber as n } from '../../shared/constants';
import { cleanerReduction, inhaledDose } from '../exposure';
import { FACTORS, type FactorId } from '../factors';
import { clock } from '../forecast';
import type { Situation } from '../situation';
import { audience, impact, type Strategy } from './strategy';

/**
 * Indoor air quality hacks: cheap changes to the rooms people already spend
 * most of their day in. Indoor PM2.5 is modelled as outdoor PM2.5 times the
 * share that infiltrates the building.
 */

/** The room a cleaner goes in: its size, who is in it, how long and how hard they breathe. */
interface CleanRoom {
  cadrId: FactorId;
  volumeId: FactorId;
  hoursId: FactorId;
  breathingId: FactorId;
  people: number;
  title: string;
  action: string;
}

/** The room to clean: a bedroom overnight for a family, the shared room for a group. */
function cleanRoom(s: Situation): CleanRoom {
  const owned = s.profile.purifier;
  if (s.profile.mode === 'family') {
    return {
      cadrId: owned ? 'purifierCadr' : 'boxFanCadr',
      volumeId: 'bedroomVolume',
      hoursId: 'sleepHours',
      breathingId: 'breathingSleep',
      people: s.people,
      title: owned ? 'Run the purifier where you sleep' : 'Build a box-fan filter for the bedroom',
      action: owned
        ? 'Move the purifier to the bedroom, shut doors and windows, and run it all night. Sleep in one room if you can.'
        : 'Tape four MERV-13 furnace filters and a cardboard base to a box fan (a Corsi–Rosenthal box) and run it in the room everyone sleeps in, doors and windows shut.',
    };
  }
  return {
    cadrId: 'boxFanCadr',
    volumeId: 'hallVolume',
    hoursId: 'sharedRoomHours',
    breathingId: 'breathingRest',
    people: Math.min(s.people, FACTORS.hallPeople.value),
    title: owned
      ? 'Add a box-fan filter to the shared room'
      : 'Make one clean-air room for the group',
    action:
      'Pick the classroom or hall with the fewest gaps, keep its windows shut on smog days and run a box-fan filter (a box fan with four MERV-13 filters taped to it). Seat children, elders and anyone with asthma there first.',
  };
}

/** Clean the air of the room people spend the longest stretch in. */
const cleanAirRoom: Strategy = {
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
      calculation: `${n(indoor)} µg/m³ indoors × ${n(removed * 100)}% removed × ${n(rate)} m³/h × ${n(hours)} h × ${n(room.people)} people`,
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

/** Shut windows through the dirtiest hours of the day. */
const closeAtPeak: Strategy = {
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
    };
  },
};

/** Seal the gaps smog leaks in through. A home-only hack. */
const sealGaps: Strategy = {
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

/** The indoor strategies, in the order the page lists them. */
export const INDOOR_STRATEGIES: readonly Strategy[] = [cleanAirRoom, closeAtPeak, sealGaps];
