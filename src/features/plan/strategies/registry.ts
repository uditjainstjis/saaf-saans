/**
 * The registry: every strategy the planner runs by default, grouped the way
 * the brief groups advice. Extending the assistant means adding a strategy
 * file and one entry here; the planner, the API and the page need no edit.
 */

import { airAtCleanestHour } from './air-at-cleanest-hour';
import { cleanAirRoom } from './clean-air-room';
import { cleanCooking } from './clean-cooking';
import { closeAtPeak } from './close-at-peak';
import { exerciseIndoors } from './exercise-indoors';
import { keepCommute } from './keep-commute';
import { maskOnCommute } from './mask-on-commute';
import { sealGaps } from './seal-gaps';
import { shiftOutdoorTime } from './shift-outdoor-time';
import { stopWasteBurning } from './stop-waste-burning';
import type { Strategy } from './strategy';
import { switchCommute } from './switch-commute';

/** Every strategy, in the order the page lists recommendations. */
export const STRATEGIES: readonly Strategy[] = [
  // Low-emission daily routines
  shiftOutdoorTime,
  exerciseIndoors,
  maskOnCommute,
  airAtCleanestHour,
  // Indoor air quality hacks
  cleanAirRoom,
  closeAtPeak,
  sealGaps,
  // Sustainable alternatives
  switchCommute,
  keepCommute,
  cleanCooking,
  stopWasteBurning,
];
