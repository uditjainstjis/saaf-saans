/**
 * Types of the plan feature (lifestyle tailoring): the situation a plan is
 * built for, a recommendation, the plan, and the brief handed to the
 * assistant. Strategies are ./strategies/; the request schema is ./schemas.ts.
 */

import type { Category } from '../../config/options';
import type { Outlook } from '../air-quality/forecast';
import type { AirReport, Place } from '../air-quality/types';
import type { FactorId } from '../impact/factors';
import type { Impact, ImpactStatus } from '../impact/types';
import type { Profile } from './schemas';

/** Everything a strategy needs to know, derived once from the profile and the air report. */
export interface Situation {
  profile: Profile;
  air: AirReport;
  outlook: Outlook;
  /** Everyone the plan covers. */
  people: number;
  /** People who make the regular commute. */
  travellers: number;
  /** True when children, elders or people with asthma or heart disease are covered. */
  vulnerable: boolean;
  /** The factor giving the share of outdoor PM2.5 that reaches indoors here. */
  infiltrationId: FactorId;
}

/** A time of day advice is for: the local hour it starts at, and how long it lasts. */
export interface When {
  /** A local hour of day; values outside 0 to 23 wrap, as on a clock. */
  hour: number;
  minutes: number;
}

/** One piece of advice, with the numbers behind it. */
export interface Recommendation {
  id: string;
  category: Category;
  status: ImpactStatus;
  title: string;
  /** What to do, in one or two sentences. */
  action: string;
  impact: Impact;
  /** The arithmetic behind {@link impact}, written out with its inputs. */
  calculation: string;
  /** Ids of the factors in features/impact/factors the arithmetic used. */
  factorIds: readonly string[];
  /** Set by advice that names a clock time, so a reminder can be offered for it. */
  when?: When;
}

/** The deterministic plan: every recommendation, and what the new ones add up to. */
export interface Plan {
  recommendations: readonly Recommendation[];
  /** Sum over recommendations with status `new`. */
  totals: Impact;
}

/** Everything a plan's wording is written from: all of it already computed. */
export interface PlanBrief {
  profile: Profile;
  place: Place;
  air: AirReport;
  plan: Plan;
  /** The health advice for this air and this audience. */
  advisory: string;
}
