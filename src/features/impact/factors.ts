/**
 * Every number the impact engine multiplies by, in one table.
 *
 * Each factor is either `published` (the value is printed in the named source)
 * or an `assumption` (a stated, adjustable modelling choice). The page lists
 * the factors behind every recommendation with that label, so a reader can
 * always tell a measured figure from a judgement.
 */

/** One multiplier used by the impact engine, with where it comes from. */
export interface Factor {
  label: string;
  value: number;
  unit: string;
  kind: 'published' | 'assumption';
  source: string;
}

const EFH = 'US EPA Exposure Factors Handbook (2011), Table 6-2, adults 21 to <31 years, mean';
const DESNZ = 'UK DESNZ/DEFRA Greenhouse Gas Conversion Factors 2024, Business travel – land';
const AKAGI = 'Akagi et al. (2011), Atmos. Chem. Phys. 11, 4039–4072, Table 1';
const MODEL = 'Modelling assumption, stated so it can be challenged';
const INFILTRATION =
  'Assumed within the range reviewed by Chen & Zhao (2011), Atmospheric Environment 45, 275–288';

/** A factor whose value is printed in `source`. */
function published(label: string, value: number, unit: string, source: string): Factor {
  return { label, value, unit, kind: 'published', source };
}

/** A stated modelling choice, with the reasoning or range it rests on. */
function assumed(label: string, value: number, unit: string, source = MODEL): Factor {
  return { label, value, unit, kind: 'assumption', source };
}

/** The factor table. Keys are the ids recommendations cite. */
export const FACTORS = {
  breathingSleep: published('Air breathed while asleep', 0.26, 'm³/h', EFH),
  breathingRest: published('Air breathed while sitting', 0.25, 'm³/h', EFH),
  breathingLight: published('Air breathed in light activity or walking', 0.72, 'm³/h', EFH),
  breathingActive: published('Air breathed in moderate exercise', 1.56, 'm³/h', EFH),
  carCo2e: published('Average petrol car', 0.1645, 'kg CO2e/km', DESNZ),
  twoWheelerCo2e: published('Average motorbike', 0.1137, 'kg CO2e/km', DESNZ),
  busCo2e: published('Average local bus', 0.1085, 'kg CO2e/passenger-km', DESNZ),
  metroCo2e: published('Light rail and tram', 0.0286, 'kg CO2e/passenger-km', DESNZ),
  wasteBurnPm: published('PM2.5 from open garbage burning', 9.8, 'g/kg burned', AKAGI),
  wasteBurnCo2: published('CO2 from open garbage burning', 1.453, 'kg/kg burned', AKAGI),
  woodCookPm: published('PM2.5 from open cooking fires', 6.64, 'g/kg fuel', AKAGI),
  n95Filter: published(
    'N95 filtration when worn',
    0.95,
    'fraction',
    'US CDC/NIOSH: an N95 filters at least 95% of airborne particles',
  ),
  whoDaily: published(
    'WHO 24-hour PM2.5 guideline',
    15,
    'µg/m³',
    'WHO global air quality guidelines (2021)',
  ),
  sensitiveLimit: published(
    'PM2.5 above which the US AQI is unhealthy for sensitive groups',
    35.4,
    'µg/m³',
    'US EPA AQI breakpoints for PM2.5 (2024)',
  ),
  generalLimit: published(
    'PM2.5 above which the US AQI is unhealthy for everyone',
    55.4,
    'µg/m³',
    'US EPA AQI breakpoints for PM2.5 (2024)',
  ),
  boxFanCadr: published(
    'Clean air from a box-fan filter (Corsi–Rosenthal box), low speed',
    1019,
    'm³/h',
    'Dal Porto et al. (2022), Aerosol Science and Technology 56(6)',
  ),
  purifierCadr: assumed(
    'Clean air from a bedroom purifier sized by the AHAM two-thirds rule',
    150,
    'm³/h',
    'AHAM: CADR in cfm at least two-thirds of the room area in sq ft; 12 m² bedroom assumed',
  ),
  bedroomVolume: assumed('Bedroom volume', 32, 'm³'),
  hallVolume: assumed('Classroom or community hall volume', 170, 'm³'),
  hallPeople: assumed('People one shared room holds', 40, 'people'),
  naturalLoss: assumed(
    'Particles lost each hour to air exchange and settling without a cleaner',
    1,
    'per hour',
  ),
  infiltrationApartment: assumed(
    'Outdoor PM2.5 reaching indoors, upper-floor apartment',
    0.5,
    'fraction',
    INFILTRATION,
  ),
  infiltrationHouse: assumed(
    'Outdoor PM2.5 reaching indoors, independent house',
    0.6,
    'fraction',
    INFILTRATION,
  ),
  infiltrationRoadside: assumed(
    'Outdoor PM2.5 reaching indoors, roadside or ground floor',
    0.7,
    'fraction',
    INFILTRATION,
  ),
  infiltrationShared: assumed(
    'Outdoor PM2.5 reaching indoors, classroom or hall',
    0.6,
    'fraction',
    INFILTRATION,
  ),
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
  commuteDays: assumed('Commuting days', 5, 'days/week'),
  walkSpeed: assumed('Walking speed', 5, 'km/h'),
  cycleSpeed: assumed('Cycling speed', 15, 'km/h'),
  roadSpeed: assumed('City speed by scooter or bus', 20, 'km/h'),
  maskFit: assumed('Share of N95 filtration kept with an everyday fit', 0.7, 'fraction'),
  groupUptake: assumed('Share of a group that joins a shared change', 0.3, 'fraction'),
  woodPerDay: assumed('Wood, dung or coal burned to cook for one household', 4, 'kg/day'),
  wastePerHundred: assumed('Waste and leaves burned in the open per 100 people', 1, 'kg/day'),
} as const satisfies Record<string, Factor>;

/** An id of a factor in {@link FACTORS}. */
export type FactorId = keyof typeof FACTORS;

/** The factors with these ids, for showing beside a recommendation. */
export function factorsFor(ids: readonly string[]): Factor[] {
  return Object.entries(FACTORS)
    .filter(([id]) => ids.includes(id))
    .map(([, factor]) => factor);
}
