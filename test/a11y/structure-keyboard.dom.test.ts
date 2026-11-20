/**
 * WCAG 2.2 checks on keyboard and pointer use: native controls, visible
 * focus and target size (2.1.1, 2.4.7, 2.4.11, 2.5.8).
 */
import { beforeAll, expect, it } from 'vitest';
import { all, html, rule, sheet, tokenPx } from '../support/markup.dom';
import { mountPage } from '../support/page.dom';
beforeAll(() => {
  mountPage();
});

it('uses only native interactive elements, with no positive tabindex or inline handlers', () => {
  for (const el of all('[tabindex]')) {
    expect(['-1', '0'], el.id).toContain(el.getAttribute('tabindex'));
  }
  expect(all('[role="button"], [onclick], [onchange], [onsubmit]')).toEqual([]);
  expect(html).not.toMatch(/\son[a-z]+=/);
});

it('draws a 3px focus ring on everything focusable, and never removes an outline', () => {
  expect(rule(':focus-visible')).toContain('outline: 3px solid var(--focus)');
  expect(sheet).not.toMatch(/outline:\s*(none|0)/);
});

it('has nothing sticky or fixed that could cover the focused element', () => {
  expect(sheet).not.toMatch(/position:\s*(sticky|fixed)/);
});

it('sizes every target at 44px or more', () => {
  expect(tokenPx('target')).toBeGreaterThanOrEqual(44);
  for (const selector of [
    '.btn',
    'select,\ntextarea',
    '.choice',
    'details > summary',
    '.error-summary a',
    '.jump a',
  ]) {
    expect(rule(selector), selector).toContain('min-height: var(--target)');
  }
});
