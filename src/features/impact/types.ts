/**
 * Types of the impact engine: what a change is worth, the factors the
 * arithmetic multiplies by, and the inputs of each formula. The formulas are
 * ./service.ts; the factor tables are ./factors/.
 */

/** What one change is worth, as computed by the impact engine. */
export interface Impact {
  /** PM2.5 not breathed in, µg per day, summed over the people covered. */
  inhaledAvoidedUg: number;
  /** PM2.5 not emitted into the neighbourhood, grams per week. */
  notEmittedG: number;
  /** Greenhouse gas not emitted, kg CO2e per week. */
  co2eSavedKg: number;
}

/** `new` for a change still to make; `keep` for a choice already paying off. */
export type ImpactStatus = 'new' | 'keep';

/** One multiplier used by the engine: a published figure, or a stated assumption. */
export interface Factor {
  label: string;
  value: number;
  unit: string;
  kind: 'published' | 'assumption';
  source: string;
}

/** One stretch of breathing: PM2.5 (µg/m³), air breathed (m³/h), how long, how many people. */
export interface Breathing {
  pm25: number;
  rate: number;
  hours: number;
  people: number;
}

/** A regular return trip: who travels, how far each way, how many days a week. */
export interface Trip {
  oneWayKm: number;
  daysPerWeek: number;
  travellers: number;
}

/** A total dose, the people it is shared by, and the outdoor air it is compared with. */
export interface DoseInContext {
  doseUg: number;
  people: number;
  /** Today's outdoor PM2.5, µg/m³. */
  pm25: number;
  /** Air breathed at rest, m³/h. */
  restRate: number;
}
