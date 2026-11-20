/**
 * Tests for form errors caught in the page: the summary, its links, the
 * invalid fields and how they are cleared.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { byId, chooseCommunity, inputEl, loadApp, settled, submit } from '../support/page.dom';
import { modelNarrative, okReply, planReply, stubFetch } from '../support/replies.dom';
beforeEach(async () => {
  await loadApp();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const errorLinks = (): string[] =>
  [...byId('error-list').querySelectorAll('li')].map((li) => li.textContent);

it('stops an invalid form before any request, lists every problem and focuses the summary', () => {
  const fetch = stubFetch();
  inputEl('adults').value = '0';
  inputEl('commuteKm').value = '';
  submit();
  expect(fetch).not.toHaveBeenCalled();
  expect(errorLinks()).toEqual([
    'Enter your city or locality.',
    'Adults must be between 1 and 12.',
    'Commute distance must be between 0 and 150.',
  ]);
  expect(byId('error-summary').hidden).toBe(false);
  expect(document.activeElement).toBe(byId('error-summary'));
});

it('marks each field invalid and describes it by its message', () => {
  stubFetch();
  submit();
  expect(inputEl('place').getAttribute('aria-invalid')).toBe('true');
  expect(byId('place-error').textContent).toBe('Enter your city or locality.');
  expect(inputEl('place').getAttribute('aria-describedby')).toContain('place-error');
});

it('links each summary line to its field', () => {
  stubFetch();
  submit();
  const link = byId('error-list').querySelector('a');
  expect(link?.getAttribute('href')).toBe('#place');
  link?.dispatchEvent(new Event('click', { cancelable: true }));
  expect(document.activeElement).toBe(inputEl('place'));
});

it('only checks the fields of the chosen mode', () => {
  stubFetch();
  chooseCommunity();
  inputEl('adults').value = '0';
  inputEl('people').value = '2';
  inputEl('place').value = 'Delhi';
  submit();
  expect(errorLinks()).toEqual(['People in the group must be between 5 and 50,000.']);
});

it('clears old errors once the form is valid', async () => {
  stubFetch(okReply(planReply()), okReply(await modelNarrative()));
  submit();
  expect(byId('error-summary').hidden).toBe(false);
  inputEl('place').value = 'Delhi';
  submit();
  await settled();
  expect(byId('error-summary').hidden).toBe(true);
  expect(inputEl('place').hasAttribute('aria-invalid')).toBe(false);
  expect(byId('place-error').textContent).toBe('');
});
