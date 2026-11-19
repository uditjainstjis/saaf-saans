/**
 * Values and wording the page and the Worker must agree on, defined once.
 *
 * The Worker imports this module. scripts/build-assets.mjs compiles it to
 * public/js/shared/constants.js (with its declarations), so the page runs the
 * same code and fills its form controls from the same lists. It imports
 * nothing: the compiled copy must stand alone.
 */

/** Who the plan is for: one household, or a group such as an RWA or a school. */
export const MODES = ['family', 'community'] as const;
/** One of {@link MODES}. */
export type Mode = (typeof MODES)[number];

/** How the household, or most of the group, travels on a normal day. */
export const COMMUTE_MODES = [
  'walk',
  'cycle',
  'two_wheeler',
  'car',
  'bus',
  'metro',
  'none',
] as const;
/** One of {@link COMMUTE_MODES}. */
export type CommuteMode = (typeof COMMUTE_MODES)[number];

/** What the kitchen burns. */
export const COOKING_FUELS = ['lpg_png', 'electric', 'biomass', 'kerosene'] as const;
/** One of {@link COOKING_FUELS}. */
export type CookingFuel = (typeof COOKING_FUELS)[number];

/** The kind of home, which sets how much outdoor air leaks in. */
export const HOME_TYPES = ['apartment', 'house', 'roadside'] as const;
/** One of {@link HOME_TYPES}. */
export type HomeType = (typeof HOME_TYPES)[number];

/** When outdoor exercise, play, assembly or sport usually happens. */
export const OUTDOOR_TIMES = ['none', 'morning', 'evening'] as const;
/** One of {@link OUTDOOR_TIMES}. */
export type OutdoorTime = (typeof OUTDOOR_TIMES)[number];

/** The kinds of community group the assistant plans for. */
export const GROUP_TYPES = ['rwa', 'school', 'neighbourhood'] as const;
/** One of {@link GROUP_TYPES}. */
export type GroupType = (typeof GROUP_TYPES)[number];

/** The three kinds of advice the brief asks for, in the order the page shows them. */
export const CATEGORIES = ['routine', 'indoor', 'alternative'] as const;
/** One of {@link CATEGORIES}. */
export type Category = (typeof CATEGORIES)[number];

/** Bounds on a request. The Worker enforces them; the form states them. */
export const LIMITS = {
  place: { min: 2, max: 80 },
  notes: { max: 300 },
  adults: { min: 1, max: 12 },
  children: { min: 0, max: 12 },
  elders: { min: 0, max: 12 },
  people: { min: 5, max: 50_000 },
  commuteKm: { min: 0, max: 150 },
  outdoorMinutes: { min: 0, max: 240 },
} as const;

/** Display labels, worded once for the form, the results and the prompt. */
export const LABELS = {
  mode: { family: 'My family', community: 'My community' },
  commute: {
    walk: 'Walk',
    cycle: 'Cycle',
    two_wheeler: 'Scooter or motorbike',
    car: 'Car',
    bus: 'Bus',
    metro: 'Metro or train',
    none: 'No regular commute',
  },
  cookingFuel: {
    lpg_png: 'LPG or piped gas',
    electric: 'Electric or induction',
    biomass: 'Wood, dung or coal',
    kerosene: 'Kerosene',
  },
  homeType: {
    apartment: 'Apartment above the ground floor',
    house: 'Independent house',
    roadside: 'Ground floor or beside a busy road',
  },
  outdoorTime: {
    none: 'No regular outdoor activity',
    morning: 'Early morning (around 7 am)',
    evening: 'Evening (around 7 pm)',
  },
  groupType: {
    rwa: 'Residents’ association (RWA)',
    school: 'School',
    neighbourhood: 'Neighbourhood group',
  },
  category: {
    routine: 'Low-emission daily routines',
    indoor: 'Indoor air quality hacks',
    alternative: 'Sustainable alternatives',
  },
} as const satisfies {
  mode: Record<Mode, string>;
  commute: Record<CommuteMode, string>;
  cookingFuel: Record<CookingFuel, string>;
  homeType: Record<HomeType, string>;
  outdoorTime: Record<OutdoorTime, string>;
  groupType: Record<GroupType, string>;
  category: Record<Category, string>;
};

/** The local hour each habitual outdoor time stands for. */
export const OUTDOOR_HOUR = { morning: 7, evening: 19 } as const;

const NUMBER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });

/** A number as the page and the Worker both print it: Indian grouping, one decimal at most. */
export const formatNumber = (n: number): string => NUMBER.format(n);

/**
 * The message for a number outside its range, worded once so it reads the
 * same whether the form or the Worker caught it.
 */
export const rangeMessage = (label: string, { min, max }: { min: number; max: number }): string =>
  `${label} must be between ${formatNumber(min)} and ${formatNumber(max)}.`;
