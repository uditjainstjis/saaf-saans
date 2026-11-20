/**
 * Factors: how much outdoor PM2.5 reaches indoors, and how long people spend
 * there. Combined with the other families in ./index.ts.
 */

import type { Factor } from '../types';
import { assumed, assumedFrom } from './factor';

const infiltration = assumedFrom(
  'Chosen within the range reviewed by Chen & Zhao (2011), Atmospheric Environment 45, 275–288',
);

/** Infiltration by building type, and the hours a day spent in each setting. */
export const BUILDING_FACTORS = {
  infiltrationApartment: infiltration(
    'Outdoor PM2.5 reaching an upper-floor apartment',
    0.5,
    'fraction',
  ),
  infiltrationHouse: infiltration('Outdoor PM2.5 reaching an independent house', 0.6, 'fraction'),
  infiltrationRoadside: infiltration(
    'Outdoor PM2.5 reaching a roadside or ground-floor home',
    0.7,
    'fraction',
  ),
  infiltrationShared: infiltration('Outdoor PM2.5 reaching a classroom or hall', 0.6, 'fraction'),
  sealingGain: assumed(
    'Share of infiltration cut by sealing door and window gaps',
    0.2,
    'fraction',
  ),
  hoursAtHome: assumed('Waking hours spent at home', 8, 'h/day'),
  sleepHours: assumed('Hours asleep', 8, 'h/day'),
  sharedRoomHours: assumed('Hours a group spends in its shared room', 6, 'h/day'),
  airingHours: assumed('Time windows stay open to air a home', 0.5, 'h/day'),
  peakHours: assumed('Length of the daily pollution peak', 3, 'h/day'),
} as const satisfies Record<string, Factor>;
