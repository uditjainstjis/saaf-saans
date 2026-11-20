/**
 * Factors: what open fires emit per kilogram burned (Akagi et al. 2011) and
 * the assumed amounts burned. Combined with the other families in ./index.ts.
 */

import type { Factor } from '../types';
import { assumed, published } from './factor';

const akagi = published('Akagi et al. (2011), Atmos. Chem. Phys. 11, 4039–4072, Table 2');

/** Emissions from burning waste and cooking on solid fuel. */
export const BURNING_FACTORS = {
  wasteBurnPm: akagi('PM2.5 from open garbage burning', 9.8, 'g/kg burned'),
  wasteBurnCo2: akagi('CO2 from open garbage burning', 1.453, 'kg/kg burned'),
  woodCookPm: akagi('PM2.5 from open cooking fires', 6.64, 'g/kg fuel'),
  woodPerDay: assumed('Wood, dung or coal burned to cook for one household', 4, 'kg/day'),
  wastePerHundred: assumed('Waste and leaves burned in the open per 100 people', 1, 'kg/day'),
} as const satisfies Record<string, Factor>;
