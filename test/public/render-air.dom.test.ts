/**
 * Tests for the air card: the band in words and symbol, the readings, the
 * hourly table and the live or typical note.
 */
import { afterEach, expect, it, vi } from 'vitest';
import { FAMILY, SMOG } from '../support/fixtures';
import { byId } from '../support/page.dom';
import { modelNarrative, okReply, planReply } from '../support/replies.dom';
import { renderWith } from '../support/results.dom';
afterEach(() => {
  vi.unstubAllGlobals();
});

it('states the AQI band in words and a symbol, with the readings and the outlook', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  expect(byId('results').hidden).toBe(false);
  expect(document.activeElement).toBe(byId('results'));
  expect(byId('air-place').textContent).toBe('Delhi, National Capital Territory of Delhi, India');
  expect(byId('air-aqi').textContent).toBe('186');
  expect(byId('air-label').textContent).toBe('Unhealthy');
  expect(byId('air-symbol').textContent).toBe('◕');
  expect(byId('air-band').className).toBe('band band--unhealthy');
  expect(byId('air-pm25').textContent).toBe('149 µg/m³');
  expect(byId('air-pm10').textContent).toBe('210 µg/m³');
  expect(byId('air-dominant').textContent).toBe('PM2.5 (fine particles)');
  expect(byId('air-best').textContent).toBe('3 pm (30 µg/m³)');
  expect(byId('air-worst').textContent).toBe('10 pm (220 µg/m³)');
  expect(byId('air-advisory').textContent).toContain('Children, elders');
  expect(byId('air-source').textContent).toContain('Live reading');
});

it('lists all 24 forecast hours in a table with row headers', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  const rows = [...byId('air-hours').querySelectorAll('tr')];
  expect(rows).toHaveLength(24);
  expect(rows[7]?.querySelector('th')?.getAttribute('scope')).toBe('row');
  expect(rows[7]?.textContent).toBe('7 am180');
});

it('says so in words when the figures are typical, not live', async () => {
  const view = planReply(FAMILY, { ...SMOG, source: 'typical' });
  view.place.region = '';
  await renderWith(okReply(view), okReply(await modelNarrative()));
  expect(byId('air-source').textContent).toContain('typical winter values');
  expect(byId('air-place').textContent).toBe('Delhi');
});

it('announces the result through the live region', async () => {
  await renderWith(okReply(planReply()), okReply(await modelNarrative()));
  expect(byId('status').getAttribute('aria-live')).toBe('polite');
  expect(byId('status').textContent).toBe('Your plan is ready, with the assistant’s explanation.');
});
