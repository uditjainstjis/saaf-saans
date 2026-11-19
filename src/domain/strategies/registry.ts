import { ALTERNATIVE_STRATEGIES } from './alternatives';
import { INDOOR_STRATEGIES } from './indoor';
import { ROUTINE_STRATEGIES } from './routine';
import type { Strategy } from './strategy';

/**
 * The registry: every strategy the planner runs by default, grouped the way
 * the brief groups advice. Extending the assistant means adding a Strategy to
 * one of the three lists (or a fourth list here); the planner, the API and the
 * page are closed to that change and need no edit.
 */
export const STRATEGIES: readonly Strategy[] = [
  ...ROUTINE_STRATEGIES,
  ...INDOOR_STRATEGIES,
  ...ALTERNATIVE_STRATEGIES,
];
