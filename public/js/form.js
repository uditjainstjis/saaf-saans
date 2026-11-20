// @ts-check
/** The profile form: filled from shared constants, switched by mode, read into a request. */
import { $ } from './dom.js';
import { CHOICE_FIELDS, FLAG_FIELDS, NUMBER_FIELDS, forMode } from './fields.js';
import { LIMITS, rangeMessage } from './shared/limits.js';
import { MODES } from './shared/options.js';

/** @typedef {import('./fields.js').Mode} Mode */
/** @typedef {{ field: string, message: string }} Issue */

/** The mode the form is in. */
export function currentMode() {
  return $('mode-community', HTMLInputElement).checked ? 'community' : 'family';
}

/** Show the fieldset for the chosen mode; the other is hidden and disabled, so it is skipped by keyboard and by submission. */
function showMode() {
  const mode = currentMode();
  for (const name of MODES) {
    const group = $(`${name}-fields`, HTMLFieldSetElement);
    group.hidden = name !== mode;
    group.disabled = name !== mode;
  }
}

/** Fill selects, set ranges and length caps from the shared constants, and wire the mode switch. */
export function initForm() {
  for (const { id, values, labels } of CHOICE_FIELDS) {
    $(id, HTMLSelectElement).replaceChildren(
      ...values.map((value) => new Option(labels[value], value)),
    );
  }
  for (const { id, range } of NUMBER_FIELDS) {
    const input = $(id, HTMLInputElement);
    input.min = String(range.min);
    input.max = String(range.max);
  }
  $('place', HTMLInputElement).maxLength = LIMITS.place.max;
  $('notes', HTMLTextAreaElement).maxLength = LIMITS.notes.max;
  for (const id of ['mode-family', 'mode-community']) {
    $(id, HTMLInputElement).addEventListener('change', showMode);
  }
  showMode();
}

/**
 * The form as a request body, and what is wrong with it. Checks mirror the
 * Worker's, in the same words, so most mistakes are caught without a round trip.
 * @returns {{ profile: Record<string, unknown>, issues: Issue[] }}
 */
export function readForm() {
  const mode = currentMode();
  /** @type {Record<string, unknown>} */
  const profile = { mode };
  /** @type {Issue[]} */
  const issues = [];
  const place = $('place', HTMLInputElement).value.trim();
  profile.place = place;
  if (place.length < LIMITS.place.min) {
    issues.push({ field: 'place', message: 'Enter your city or locality.' });
  }
  for (const { id, label, range } of forMode(NUMBER_FIELDS, mode)) {
    const raw = $(id, HTMLInputElement).value;
    const value = raw.trim() === '' ? NaN : Number(raw);
    profile[id] = value;
    if (!(value >= range.min && value <= range.max)) {
      issues.push({ field: id, message: rangeMessage(label, range) });
    }
  }
  for (const { id } of forMode(CHOICE_FIELDS, mode)) profile[id] = $(id, HTMLSelectElement).value;
  for (const { id } of forMode(FLAG_FIELDS, mode)) profile[id] = $(id, HTMLInputElement).checked;
  profile.notes = $('notes', HTMLTextAreaElement).value.trim();
  return { profile, issues };
}
