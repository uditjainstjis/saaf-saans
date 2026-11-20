/**
 * Tests for replies the page cannot use, and for a second submission while
 * the first is in flight.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { byId, inputEl, loadApp, settled, submit } from '../support/page.dom';
import { modelNarrative, okReply, planReply, stubFetch } from '../support/replies.dom';
beforeEach(async () => {
  await loadApp();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const errorLinks = (): string[] =>
  [...byId('error-list').querySelectorAll('li')].map((li) => li.textContent);

it('reports a reply it cannot render as a general problem, not a blank page', async () => {
  const hollow = { place: {}, air: {}, totals: {}, recommendations: [], findings: [] };
  stubFetch(okReply(hollow));
  inputEl('place').value = 'Delhi';
  submit();
  await settled();
  expect(errorLinks()).toEqual(['Something went wrong. Please try again.']);
});

it('survives a reply that is not JSON at all', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('<html>gateway error</html>', { status: 502 })),
  );
  inputEl('place').value = 'Delhi';
  submit();
  await settled();
  expect(errorLinks()).toEqual(['The request failed (502). Please try again.']);
});

it('ignores a second submission while the first is in flight', async () => {
  const fetch = stubFetch(okReply(planReply()), okReply(await modelNarrative()));
  inputEl('place').value = 'Delhi';
  submit();
  expect(byId('submit-btn').getAttribute('aria-disabled')).toBe('true');
  expect(byId('submit-btn').textContent).toBe('Reading your air…');
  submit();
  await settled();
  expect(fetch).toHaveBeenCalledTimes(2);
});
