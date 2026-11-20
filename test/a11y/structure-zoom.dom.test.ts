/**
 * WCAG 2.2 checks on zoom, reflow and motion (1.4.4, 1.4.10, 1.4.12, 2.3.3).
 */
import { beforeAll, expect, it } from 'vitest';
import { rule, sheet } from '../support/markup.dom';
import { mountPage } from '../support/page.dom';
beforeAll(() => {
  mountPage();
});

it('lets the visitor zoom', () => {
  const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? '';
  expect(viewport).toBe('width=device-width, initial-scale=1');
});

it('sets body text at 18px in rem, so it follows the visitor’s font size', () => {
  expect(rule('body')).toContain('font-size: 1.125rem');
  expect(sheet).not.toMatch(/font-size:\s*\d+px/);
  const sizes = [...sheet.matchAll(/font-size: ([\d.]+)rem/g)].map((m) => Number(m[1]) * 16);
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(17);
});

it('has no fixed width that would force sideways scrolling at 320px', () => {
  const widths = [...sheet.matchAll(/[^-]width:\s*(\d+)px/g)].map((m) => Number(m[1]));
  expect(widths.filter((w) => w > 320)).toEqual([]);
  const columns = [...sheet.matchAll(/minmax\(([\d.]+)rem/g)].map((m) => Number(m[1]) * 18);
  expect(Math.max(...columns)).toBeLessThanOrEqual(320 - 32 - 60);
  expect(rule('.table-scroll')).toContain('overflow-x: auto');
});

it('honours prefers-reduced-motion and forced colours', () => {
  expect(sheet).toContain('@media (prefers-reduced-motion: reduce)');
  expect(sheet).toContain('@media (prefers-reduced-motion: no-preference)');
  expect(sheet).toContain('@media (forced-colors: active)');
});
