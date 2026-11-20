// @ts-check
/**
 * The form's fields, described once: which controls are numbers with a shared
 * range, which are choices with shared options, and which belong to one mode.
 * Options and ranges come from the constants the Worker validates against.
 */
import { LABELS } from './shared/labels.js';
import { LIMITS } from './shared/limits.js';
import {
  COMMUTE_MODES,
  COOKING_FUELS,
  GROUP_TYPES,
  HOME_TYPES,
  OUTDOOR_TIMES,
} from './shared/options.js';

/** @typedef {'family' | 'community'} Mode */

/**
 * Number fields: id, the label used in messages, the shared range, and the mode they belong to.
 * @type {ReadonlyArray<{ id: string, label: string, range: { min: number, max: number }, mode?: Mode }>}
 */
export const NUMBER_FIELDS = [
  { id: 'adults', label: 'Adults', range: LIMITS.adults, mode: 'family' },
  { id: 'children', label: 'Children', range: LIMITS.children, mode: 'family' },
  { id: 'elders', label: 'Elders', range: LIMITS.elders, mode: 'family' },
  { id: 'people', label: 'People in the group', range: LIMITS.people, mode: 'community' },
  { id: 'commuteKm', label: 'Commute distance', range: LIMITS.commuteKm },
  { id: 'outdoorMinutes', label: 'Outdoor minutes', range: LIMITS.outdoorMinutes },
];

/**
 * Choice fields: id, option values, their labels, and the mode they belong to.
 * @type {ReadonlyArray<{ id: string, values: readonly string[], labels: Readonly<Record<string, string>>, mode?: Mode }>}
 */
export const CHOICE_FIELDS = [
  { id: 'homeType', values: HOME_TYPES, labels: LABELS.homeType, mode: 'family' },
  { id: 'cookingFuel', values: COOKING_FUELS, labels: LABELS.cookingFuel, mode: 'family' },
  { id: 'groupType', values: GROUP_TYPES, labels: LABELS.groupType, mode: 'community' },
  { id: 'commute', values: COMMUTE_MODES, labels: LABELS.commute },
  { id: 'outdoorTime', values: OUTDOOR_TIMES, labels: LABELS.outdoorTime },
];

/**
 * Yes/no fields: id, and the mode they belong to.
 * @type {ReadonlyArray<{ id: string, mode?: Mode }>}
 */
export const FLAG_FIELDS = [
  { id: 'wasteBurning', mode: 'community' },
  { id: 'purifier' },
  { id: 'sensitive' },
];

/**
 * The fields of a list that apply in a mode.
 * @template {{ mode?: Mode }} F
 * @param {ReadonlyArray<F>} fields
 * @param {Mode} mode
 * @returns {F[]}
 */
export const forMode = (fields, mode) =>
  fields.filter((f) => f.mode === undefined || f.mode === mode);
