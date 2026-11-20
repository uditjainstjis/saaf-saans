import type { Category } from '../../../config/constants';
import { round1 } from '../../impact/service';
import type { FactorId } from '../../impact/factors';
import type { Situation } from '../situation';
import type { Impact, Recommendation } from '../types';

/** What a strategy returns: a recommendation without the identity its strategy supplies. */
export interface Advice extends Omit<Recommendation, 'id' | 'category' | 'factorIds'> {
  factorIds: readonly FactorId[];
}

/**
 * One way of improving a household's or group's air: the unit of extension.
 *
 * A strategy looks at a situation and either has advice for it or does not.
 * The planner (src/features/plan/planner.ts) runs whatever list it is given, so a new
 * kind of advice is a new Strategy added to the registry; nothing that calls
 * the planner changes.
 */
export interface Strategy {
  readonly id: string;
  readonly category: Category;
  /** Advice for this situation, or null when the strategy does not apply to it. */
  advise(situation: Situation): Advice | null;
}

/** An impact with every figure rounded for reporting; unnamed figures are zero. */
export function impact(parts: Partial<Impact>): Impact {
  return {
    inhaledAvoidedUg: round1(parts.inhaledAvoidedUg ?? 0),
    notEmittedG: round1(parts.notEmittedG ?? 0),
    co2eSavedKg: round1(parts.co2eSavedKg ?? 0),
  };
}

/** "your household" or "your group": who a sentence is addressed to. */
export const audience = ({ profile }: Situation): string =>
  profile.mode === 'family' ? 'your household' : 'your group';
