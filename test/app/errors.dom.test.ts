import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  $,
  chooseCommunity,
  input,
  loadApp,
  modelNarrative,
  ok,
  planReply,
  settled,
  stubFetch,
  submit,
} from './harness.dom';

const errorLinks = (): string[] =>
  [...$('error-list').querySelectorAll('li')].map((li) => li.textContent);

beforeEach(async () => {
  await loadApp();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('errors', () => {
  it('stops an invalid form before any request, lists every problem and focuses the summary', () => {
    const fetch = stubFetch();
    input('adults').value = '0';
    input('commuteKm').value = '';
    submit();
    expect(fetch).not.toHaveBeenCalled();
    expect(errorLinks()).toEqual([
      'Enter your city or locality.',
      'Adults must be between 1 and 12.',
      'Commute distance must be between 0 and 150.',
    ]);
    expect($('error-summary').hidden).toBe(false);
    expect(document.activeElement).toBe($('error-summary'));
  });

  it('marks each field invalid and describes it by its message', () => {
    stubFetch();
    submit();
    expect(input('place').getAttribute('aria-invalid')).toBe('true');
    expect($('place-error').textContent).toBe('Enter your city or locality.');
    expect(input('place').getAttribute('aria-describedby')).toContain('place-error');
  });

  it('links each summary line to its field', () => {
    stubFetch();
    submit();
    const link = $('error-list').querySelector('a');
    expect(link?.getAttribute('href')).toBe('#place');
    link?.dispatchEvent(new Event('click', { cancelable: true }));
    expect(document.activeElement).toBe(input('place'));
  });

  it('only checks the fields of the chosen mode', () => {
    stubFetch();
    chooseCommunity();
    input('adults').value = '0';
    input('people').value = '2';
    input('place').value = 'Delhi';
    submit();
    expect(errorLinks()).toEqual(['People in the group must be between 5 and 50,000.']);
  });

  it('clears old errors once the form is valid', async () => {
    stubFetch(ok(planReply()), ok(await modelNarrative()));
    submit();
    expect($('error-summary').hidden).toBe(false);
    input('place').value = 'Delhi';
    submit();
    await settled();
    expect($('error-summary').hidden).toBe(true);
    expect(input('place').hasAttribute('aria-invalid')).toBe(false);
    expect($('place-error').textContent).toBe('');
  });

  it('shows the Worker’s issues against their fields', async () => {
    const issues = [{ field: 'place', message: 'We could not find that place.' }];
    stubFetch({ status: 404, body: { error: 'x', code: 'place_not_found', issues } });
    input('place').value = 'Atlantis';
    submit();
    await settled();
    expect(errorLinks()).toEqual(['We could not find that place.']);
    expect(input('place').getAttribute('aria-invalid')).toBe('true');
    expect($('results').hidden).toBe(true);
  });

  it('shows a general problem as plain text when no field is to blame', async () => {
    const issues = [{ field: 'form', message: 'Too many requests.' }, { field: 7 }, 'junk'];
    stubFetch({ status: 429, body: { issues } });
    input('place').value = 'Delhi';
    submit();
    await settled();
    expect(errorLinks()).toEqual(['Too many requests.']);
    expect($('error-list').querySelector('a')).toBeNull();
  });

  it.each([
    [{ status: 500, body: 'not an object' }, 'The request failed (500). Please try again.'],
    [{ status: 502, body: { issues: 'nope' } }, 'The request failed (502). Please try again.'],
    [{ status: 200, body: { unexpected: true } }, 'The reply could not be read. Please try again.'],
    [new Error('offline'), 'Could not reach Saaf Saans. Check your connection and try again.'],
  ])('explains a failed request in words: %#', async (reply, message) => {
    stubFetch(reply);
    input('place').value = 'Delhi';
    submit();
    await settled();
    expect(errorLinks()).toEqual([message]);
    expect($('status').textContent).toBe('');
  });

  it('survives a reply that is not JSON at all', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>gateway error</html>', { status: 502 })),
    );
    input('place').value = 'Delhi';
    submit();
    await settled();
    expect(errorLinks()).toEqual(['The request failed (502). Please try again.']);
  });

  it('ignores a second submission while the first is in flight', async () => {
    const fetch = stubFetch(ok(planReply()), ok(await modelNarrative()));
    input('place').value = 'Delhi';
    submit();
    expect($('submit-btn').getAttribute('aria-disabled')).toBe('true');
    expect($('submit-btn').textContent).toBe('Reading your air…');
    submit();
    await settled();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
