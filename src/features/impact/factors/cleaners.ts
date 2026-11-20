/**
 * Factors: air cleaners and the rooms they clean. Combined with the other
 * families in ./index.ts; the mass-balance formula is ../service.ts.
 */

import type { Factor } from '../types';
import { assumed, assumedFrom, published } from './factor';

const dalPorto = published(
  'Dal Porto et al. (2022), Aerosol Science and Technology 56(6), 564–572',
);
const aham = assumedFrom(
  'AHAM: CADR in cfm at least two-thirds of the room area in sq ft; 12 m² bedroom assumed',
);

/** Clean air delivery rates and room sizes. */
export const CLEANER_FACTORS = {
  boxFanCadr: dalPorto('Clean air from a box-fan filter, lowest fan speed', 1019, 'm³/h'),
  purifierCadr: aham('Clean air from a bedroom purifier sized by the AHAM rule', 150, 'm³/h'),
  bedroomVolume: assumed('Bedroom volume', 32, 'm³'),
  hallVolume: assumed('Classroom or community hall volume', 170, 'm³'),
  hallPeople: assumed('People one shared room holds', 40, 'people'),
  naturalLoss: assumed('Particles lost each hour to air exchange and settling', 1, 'per hour'),
} as const satisfies Record<string, Factor>;
