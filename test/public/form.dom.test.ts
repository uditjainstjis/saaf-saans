import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as shared from '../../src/config/constants';
import { COMMUNITY, FAMILY } from '../support/fixtures';
import {
  $,
  chooseCommunity,
  input,
  loadApp,
  modelNarrative,
  ok,
  planReply,
  select,
  sentBody,
  sentPaths,
  settled,
  stubFetch,
  submit,
} from '../support/page.dom';

const { LABELS, LIMITS } = shared;

const optionValues = (id: string): string[] => [...select(id).options].map((o) => o.value);

beforeEach(async () => {
  await loadApp();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('one source of truth for the form', () => {
  it('fills every select from the enums the Worker validates against', () => {
    expect(optionValues('commute')).toEqual([...shared.COMMUTE_MODES]);
    expect(optionValues('cookingFuel')).toEqual([...shared.COOKING_FUELS]);
    expect(optionValues('homeType')).toEqual([...shared.HOME_TYPES]);
    expect(optionValues('outdoorTime')).toEqual([...shared.OUTDOOR_TIMES]);
    expect(optionValues('groupType')).toEqual([...shared.GROUP_TYPES]);
    expect(select('commute').options[3]?.textContent).toBe(LABELS.commute.car);
  });

  it('takes ranges and length caps from the shared limits, not from the markup', () => {
    expect(input('adults').min).toBe(String(LIMITS.adults.min));
    expect(input('people').max).toBe(String(LIMITS.people.max));
    expect(input('commuteKm').max).toBe(String(LIMITS.commuteKm.max));
    expect(input('place').maxLength).toBe(LIMITS.place.max);
    expect($('notes', HTMLTextAreaElement).maxLength).toBe(LIMITS.notes.max);
  });

  it('offers exactly the two modes of the brief', () => {
    const modes = [...document.querySelectorAll('input[name="mode"]')].map((el) =>
      el.getAttribute('value'),
    );
    expect(modes).toEqual([...shared.MODES]);
  });

  it('runs the page on the compiled copy of src/config/constants.ts', async () => {
    const compiled: typeof shared = await import('../../public/js/shared/constants.js');
    expect(Object.keys(compiled).sort()).toEqual(Object.keys(shared).sort());
    expect(compiled.LIMITS).toEqual(shared.LIMITS);
    expect(compiled.LABELS).toEqual(shared.LABELS);
    expect(compiled.formatNumber(1593.2)).toBe('1,593.2');
    expect(compiled.rangeMessage('Adults', LIMITS.adults)).toBe(
      shared.rangeMessage('Adults', LIMITS.adults),
    );
  });
});

describe('families and communities', () => {
  it('shows household fields by default and keeps community fields out of reach', () => {
    expect($('family-fields', HTMLFieldSetElement).hidden).toBe(false);
    expect($('community-fields', HTMLFieldSetElement).hidden).toBe(true);
    expect($('community-fields', HTMLFieldSetElement).disabled).toBe(true);
  });

  it('swaps the fieldsets when the mode changes, and back', () => {
    chooseCommunity();
    expect($('family-fields', HTMLFieldSetElement).disabled).toBe(true);
    expect($('community-fields', HTMLFieldSetElement).hidden).toBe(false);
    input('mode-family').checked = true;
    input('mode-family').dispatchEvent(new Event('change'));
    expect($('family-fields', HTMLFieldSetElement).hidden).toBe(false);
  });

  it('sends a family profile the Worker’s schema accepts', async () => {
    const fetch = stubFetch(ok(planReply()), ok(await modelNarrative()));
    input('place').value = '  Delhi ';
    input('children').value = '1';
    input('elders').value = '1';
    input('commuteKm').value = '12';
    select('commute').value = 'car';
    select('outdoorTime').value = 'morning';
    $('notes', HTMLTextAreaElement).value = 'Grandmother has asthma.';
    submit();
    await settled();
    expect(sentBody(fetch)).toEqual(FAMILY);
    expect(sentPaths(fetch)).toEqual(['/api/plan', '/api/assistant']);
    expect(sentBody(fetch, 1)).toEqual(FAMILY);
  });

  it('sends a community profile the Worker’s schema accepts', async () => {
    const fetch = stubFetch(ok(planReply(COMMUNITY)), ok(await modelNarrative(COMMUNITY)));
    chooseCommunity();
    input('place').value = 'Delhi';
    input('wasteBurning').checked = true;
    select('commute').value = 'two_wheeler';
    input('commuteKm').value = '5';
    select('outdoorTime').value = 'morning';
    input('outdoorMinutes').value = '20';
    submit();
    await settled();
    expect(sentBody(fetch)).toEqual(COMMUNITY);
  });
});
