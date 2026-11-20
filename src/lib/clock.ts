/**
 * The production Clock port: the system time. Tests inject a fixed clock
 * instead (test/support/fakes.ts).
 */

import type { Clock } from './ports';

/** Tells the current time. */
export const systemClock: Clock = { now: () => new Date() };
