/**
 * Dates and the time: the production Clock port (the system time; tests
 * inject a fixed clock from test/support/fakes.ts) and calendar arithmetic.
 * This is the one module that constructs a Date.
 */

import type { Clock } from './ports';

/** Tells the current time. */
export const systemClock: Clock = { now: () => new Date() };

const DAY_MS = 86_400_000;

/** The calendar day after an ISO date: "2026-12-31" gives "2027-01-01". It reads no clock. */
export const dayAfter = (isoDate: string): string =>
  new Date(Date.parse(`${isoDate}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10);
