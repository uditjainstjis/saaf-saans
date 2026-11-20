/**
 * Tests for how the page shows refusals from the Worker: issues against their
 * fields, general problems, and failures put into words.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { byId, inputEl, loadApp, settled, submit } from '../support/page.dom';
import { stubFetch } from '../support/replies.dom';
beforeEach(async () => {
  await loadApp();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const errorLinks = (): string[] =>
  [...byId('error-list').querySelectorAll('li')].map((li) => li.textContent);

it('shows the Worker’s issues against their fields', async () => {
  const issues = [{ field: 'place', message: 'We could not find that place.' }];
  stubFetch({ status: 404, body: { error: 'x', code: 'place_not_found', issues } });
  inputEl('place').value = 'Atlantis';
  submit();
  await settled();
  expect(errorLinks()).toEqual(['We could not find that place.']);
  expect(inputEl('place').getAttribute('aria-invalid')).toBe('true');
  expect(byId('results').hidden).toBe(true);
});

it('shows a general problem as plain text when no field is to blame', async () => {
  const issues = [{ field: 'form', message: 'Too many requests.' }, { field: 7 }, 'junk'];
  stubFetch({ status: 429, body: { issues } });
  inputEl('place').value = 'Delhi';
  submit();
  await settled();
  expect(errorLinks()).toEqual(['Too many requests.']);
  expect(byId('error-list').querySelector('a')).toBeNull();
});

it.each([
  [{ status: 500, body: 'not an object' }, 'The request failed (500). Please try again.'],
  [{ status: 502, body: { issues: 'nope' } }, 'The request failed (502). Please try again.'],
  [{ status: 200, body: { unexpected: true } }, 'The reply could not be read. Please try again.'],
  [new Error('offline'), 'Could not reach Saaf Saans. Check your connection and try again.'],
])('explains a failed request in words: %#', async (reply, message) => {
  stubFetch(reply);
  inputEl('place').value = 'Delhi';
  submit();
  await settled();
  expect(errorLinks()).toEqual([message]);
  expect(byId('status').textContent).toBe('');
});

it('marks a field that has no message slot of its own, such as a checkbox', async () => {
  const issues = [{ field: 'purifier', message: 'Air purifier: choose yes or no.' }];
  stubFetch({ status: 400, body: { issues } });
  inputEl('place').value = 'Delhi';
  submit();
  await settled();
  expect(inputEl('purifier').getAttribute('aria-invalid')).toBe('true');
  expect(errorLinks()).toEqual(['Air purifier: choose yes or no.']);
});
