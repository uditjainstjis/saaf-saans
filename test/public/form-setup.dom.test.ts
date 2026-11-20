/**
 * Tests that the form has one source of truth: its options, ranges and length
 * caps come from src/config/, the same modules the Worker validates against,
 * compiled for the page by scripts/build-assets.mjs.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as labels from '../../src/config/labels';
import * as limits from '../../src/config/limits';
import * as options from '../../src/config/options';
import { byId, inputEl, loadApp, selectEl } from '../support/page.dom';

const optionValues = (id: string): string[] => [...selectEl(id).options].map((o) => o.value);

beforeEach(async () => {
  await loadApp();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

it('fills every select from the options the Worker validates against', () => {
  expect(optionValues('commute')).toEqual([...options.COMMUTE_MODES]);
  expect(optionValues('cookingFuel')).toEqual([...options.COOKING_FUELS]);
  expect(optionValues('homeType')).toEqual([...options.HOME_TYPES]);
  expect(optionValues('outdoorTime')).toEqual([...options.OUTDOOR_TIMES]);
  expect(optionValues('groupType')).toEqual([...options.GROUP_TYPES]);
  expect(selectEl('commute').options[0]?.textContent).toBe(labels.LABELS.commute.car);
});

it('takes ranges and length caps from the shared limits, not from the markup', () => {
  const { LIMITS } = limits;
  expect(inputEl('adults').min).toBe(String(LIMITS.adults.min));
  expect(inputEl('people').max).toBe(String(LIMITS.people.max));
  expect(inputEl('commuteKm').max).toBe(String(LIMITS.commuteKm.max));
  expect(inputEl('place').maxLength).toBe(LIMITS.place.max);
  expect(byId('notes', HTMLTextAreaElement).maxLength).toBe(LIMITS.notes.max);
});

it('offers exactly the two modes of the brief', () => {
  const modes = [...document.querySelectorAll('input[name="mode"]')].map((el) =>
    el.getAttribute('value'),
  );
  expect(modes).toEqual([...options.MODES]);
});

it('runs the page on compiled copies of src/config that match their sources', async () => {
  const compiledOptions: typeof options = await import('../../public/js/shared/options.js');
  const compiledLabels: typeof labels = await import('../../public/js/shared/labels.js');
  const compiledLimits: typeof limits = await import('../../public/js/shared/limits.js');
  expect({ ...compiledOptions }).toEqual({ ...options });
  expect(compiledLabels.LABELS).toEqual(labels.LABELS);
  expect(Object.keys(compiledLimits).sort()).toEqual(Object.keys(limits).sort());
  expect(compiledLimits.LIMITS).toEqual(limits.LIMITS);
  expect(compiledLimits.formatNumber(1593.2)).toBe('1,593.2');
  expect(compiledLimits.rangeMessage('Adults', limits.LIMITS.adults)).toBe(
    limits.rangeMessage('Adults', limits.LIMITS.adults),
  );
});
