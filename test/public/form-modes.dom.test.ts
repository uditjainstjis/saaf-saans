/**
 * Tests for the two modes of the form: which fields each shows, and that each
 * sends a profile the Worker’s schema accepts.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { COMMUNITY, FAMILY } from '../support/fixtures';
import {
  byId,
  chooseCommunity,
  inputEl,
  loadApp,
  selectEl,
  settled,
  submit,
} from '../support/page.dom';
import {
  modelNarrative,
  okReply,
  planReply,
  sentBody,
  sentPaths,
  stubFetch,
} from '../support/replies.dom';
beforeEach(async () => {
  await loadApp();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows household fields by default and keeps community fields out of reach', () => {
  expect(byId('family-fields', HTMLFieldSetElement).hidden).toBe(false);
  expect(byId('community-fields', HTMLFieldSetElement).hidden).toBe(true);
  expect(byId('community-fields', HTMLFieldSetElement).disabled).toBe(true);
});

it('swaps the fieldsets when the mode changes, and back', () => {
  chooseCommunity();
  expect(byId('family-fields', HTMLFieldSetElement).disabled).toBe(true);
  expect(byId('community-fields', HTMLFieldSetElement).hidden).toBe(false);
  inputEl('mode-family').checked = true;
  inputEl('mode-family').dispatchEvent(new Event('change'));
  expect(byId('family-fields', HTMLFieldSetElement).hidden).toBe(false);
});

it('sends a family profile the Worker’s schema accepts', async () => {
  const fetch = stubFetch(okReply(planReply()), okReply(await modelNarrative()));
  inputEl('place').value = '  Delhi ';
  inputEl('children').value = '1';
  inputEl('elders').value = '1';
  inputEl('commuteKm').value = '12';
  selectEl('commute').value = 'car';
  selectEl('outdoorTime').value = 'morning';
  byId('notes', HTMLTextAreaElement).value = 'Grandmother has asthma.';
  submit();
  await settled();
  expect(sentBody(fetch)).toEqual(FAMILY);
  expect(sentPaths(fetch)).toEqual(['/api/plan', '/api/assistant']);
  expect(sentBody(fetch, 1)).toEqual(FAMILY);
});

it('sends a community profile the Worker’s schema accepts', async () => {
  const fetch = stubFetch(okReply(planReply(COMMUNITY)), okReply(await modelNarrative(COMMUNITY)));
  chooseCommunity();
  inputEl('place').value = 'Delhi';
  inputEl('wasteBurning').checked = true;
  selectEl('commute').value = 'two_wheeler';
  inputEl('commuteKm').value = '5';
  selectEl('outdoorTime').value = 'morning';
  inputEl('outdoorMinutes').value = '20';
  submit();
  await settled();
  expect(sentBody(fetch)).toEqual(COMMUNITY);
});
