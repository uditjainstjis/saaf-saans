/**
 * Chooses the room an air cleaner goes in: a bedroom overnight for a family,
 * the shared room for a group. The arithmetic that uses it is
 * ./clean-air-room.ts.
 */

import { type FactorId, FACTORS } from '../../impact/factors';
import type { Situation } from '../types';

/** The room a cleaner goes in: its size, who is in it, how long and how hard they breathe. */
export interface CleanRoom {
  cadrId: FactorId;
  volumeId: FactorId;
  hoursId: FactorId;
  breathingId: FactorId;
  people: number;
  title: string;
  action: string;
}

/** The room to clean: a bedroom overnight for a family, the shared room for a group. */
export function cleanRoom(s: Situation): CleanRoom {
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
