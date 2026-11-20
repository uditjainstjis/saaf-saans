/**
 * WCAG 2.2 checks on status messages and on colour never being the only
 * signal (1.4.1, 3.3.1, 4.1.3).
 */
import { beforeAll, expect, it } from 'vitest';
import { rule, sheet } from '../support/markup.dom';
import { mountPage } from '../support/page.dom';
beforeAll(() => {
  mountPage();
});

it('announces results politely and errors assertively', () => {
  const status = document.getElementById('status');
  expect(status?.getAttribute('role')).toBe('status');
  expect(status?.getAttribute('aria-live')).toBe('polite');
  const summary = document.getElementById('error-summary');
  expect(summary?.getAttribute('role')).toBe('alert');
  expect(summary?.getAttribute('tabindex')).toBe('-1');
});

it('prints the AQI as a number, a category in words and a symbol', () => {
  for (const id of ['air-aqi', 'air-label', 'air-symbol']) {
    expect(document.getElementById(id), id).not.toBeNull();
  }
  expect(document.getElementById('air-symbol')?.getAttribute('aria-hidden')).toBe('true');
});

it('marks invalid fields with a thicker border and a message, not colour alone', () => {
  expect(rule("[aria-invalid='true']")).toContain('border-width: 3px');
});

it('puts no words in CSS generated content, where a screen reader may miss them', () => {
  expect(sheet.match(/content:\s*['"][^'"]*[a-z]/gi)).toBeNull();
});
