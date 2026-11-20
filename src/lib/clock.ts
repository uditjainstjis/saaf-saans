import type { Clock } from './ports';

/** The production {@link Clock}: the system time. */
export const systemClock: Clock = { now: () => new Date() };
