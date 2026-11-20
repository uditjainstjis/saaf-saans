/**
 * Bounds on a request and the wording for breaking them, defined once: the
 * Worker enforces them and the form states them (compiled to
 * public/js/shared/limits.js, so it imports nothing). Choices are in ./options.ts.
 */

/** The accepted range or length of each free field of a profile. */
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

const NUMBER = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 });

/** A number as the page and the Worker both print it: Indian grouping, four decimals at most. */
export const formatNumber = (n: number): string => NUMBER.format(n);

/** The message for a number outside its range, worded the same wherever it is caught. */
export const rangeMessage = (label: string, { min, max }: { min: number; max: number }): string =>
  `${label} must be between ${formatNumber(min)} and ${formatNumber(max)}.`;
