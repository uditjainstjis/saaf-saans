/**
 * The choices a lifestyle profile is built from, defined once for the Worker
 * and the page (compiled to public/js/shared/options.js, so it imports
 * nothing). Display labels are in ./labels.ts, numeric bounds in ./limits.ts.
 */

/** Who the plan is for: one household, or a group such as an RWA or a school. */
export const MODES = ['family', 'community'] as const;
/** One of {@link MODES}. */
export type Mode = (typeof MODES)[number];

/** How the household, or most of the group, travels on a normal day. The first is the form's default. */
export const COMMUTE_MODES = [
  'car',
  'two_wheeler',
  'bus',
  'metro',
  'cycle',
  'walk',
  'none',
] as const;
/** One of {@link COMMUTE_MODES}. */
export type CommuteMode = (typeof COMMUTE_MODES)[number];

/** What the kitchen burns. */
export const COOKING_FUELS = ['lpg_png', 'electric', 'biomass'] as const;
/** One of {@link COOKING_FUELS}. */
export type CookingFuel = (typeof COOKING_FUELS)[number];

/** The kind of home, which sets how much outdoor air leaks in. */
export const HOME_TYPES = ['apartment', 'house', 'roadside'] as const;
/** One of {@link HOME_TYPES}. */
export type HomeType = (typeof HOME_TYPES)[number];

/** When outdoor exercise, play, assembly or sport usually happens. */
export const OUTDOOR_TIMES = ['morning', 'evening', 'none'] as const;
/** One of {@link OUTDOOR_TIMES}. */
export type OutdoorTime = (typeof OUTDOOR_TIMES)[number];

/** The local hour each habitual outdoor time stands for. */
export const OUTDOOR_HOUR = { morning: 7, evening: 19 } as const;

/** The kinds of community group the assistant plans for. */
export const GROUP_TYPES = ['rwa', 'school', 'neighbourhood'] as const;
/** One of {@link GROUP_TYPES}. */
export type GroupType = (typeof GROUP_TYPES)[number];

/** The three kinds of advice the brief asks for, in the order the page shows them. */
export const CATEGORIES = ['routine', 'indoor', 'alternative'] as const;
/** One of {@link CATEGORIES}. */
export type Category = (typeof CATEGORIES)[number];
