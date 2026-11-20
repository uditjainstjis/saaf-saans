/**
 * Tests for the theme toggle: light by default, remembered, and working
 * without storage.
 */
import { afterEach, expect, it, vi } from 'vitest';
import { byId, loadApp, memoryStorage } from '../support/page.dom';
afterEach(() => {
  vi.unstubAllGlobals();
});

const toggle = (): HTMLElement => byId('theme-toggle');

it('starts light, switches to dark and back, and remembers the choice', async () => {
  const storage = memoryStorage();
  await loadApp({ storage });
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(toggle().getAttribute('aria-pressed')).toBe('false');
  toggle().click();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(toggle().getAttribute('aria-pressed')).toBe('true');
  expect(storage.getItem('saaf-saans-theme')).toBe('dark');
  await loadApp({ storage });
  expect(document.documentElement.dataset.theme).toBe('dark');
  toggle().click();
  expect(storage.getItem('saaf-saans-theme')).toBe('light');
});

it('still works where storage is unavailable', async () => {
  await loadApp({ storage: undefined });
  expect(document.documentElement.dataset.theme).toBe('light');
  toggle().click();
  expect(document.documentElement.dataset.theme).toBe('dark');
});
