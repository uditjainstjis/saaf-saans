/**
 * WCAG 2.2 checks on the jump navigation at the top of the results: a named
 * landmark whose links lead to headings that can take focus (2.4.1, 2.4.3,
 * 2.4.4, 4.1.2), laid out as a wrapping row of full-size targets (2.5.8).
 */
import { beforeAll, expect, it } from 'vitest';
import { all, rule } from '../support/markup.dom';
import { mountPage } from '../support/page.dom';

beforeAll(() => {
  mountPage();
});

/** The heading a jump link points at. */
const targetOf = (link: Element): HTMLElement | null =>
  document.getElementById((link.getAttribute('href') ?? '').slice(1));

it('is the one navigation landmark, named, and the first thing in the results', () => {
  const [nav, ...others] = all('nav');
  expect(others).toEqual([]);
  expect(nav?.getAttribute('aria-label')).toBe('Sections of your plan');
  expect(nav?.parentElement?.id).toBe('results');
  expect(nav?.previousElementSibling?.id).toBe('results-h');
});

it('links to the air, the assistant, the impact and the three groups of recommendations', () => {
  expect(all('nav a').map((link) => link.getAttribute('href'))).toEqual([
    '#air-h',
    '#assistant-h',
    '#impact-h',
    '#routine-h',
    '#indoor-h',
    '#alternative-h',
  ]);
});

it('leads every link to a heading that can take focus, so keyboard and screen reader land there', () => {
  for (const link of all('nav a')) {
    expect(targetOf(link)?.tagName, link.textContent).toBe('H3');
    expect(targetOf(link)?.getAttribute('tabindex'), link.textContent).toBe('-1');
  }
});

it('moves focus to the heading when its target is focused, as following the link does', () => {
  document.getElementById('results')?.removeAttribute('hidden');
  for (const link of all('nav a')) {
    targetOf(link)?.focus();
    expect(document.activeElement, link.textContent).toBe(targetOf(link));
  }
});

it('gives every link a name of its own that says where it goes', () => {
  const names = all('nav a').map((link) => link.textContent.trim());
  expect(names.every((name) => name.length > 3)).toBe(true);
  expect(new Set(names).size).toBe(names.length);
});

it('lays the links out as a wrapping row of full-size targets, hidden in print', () => {
  expect(rule('.jump ul')).toContain('flex-wrap: wrap');
  expect(rule('.jump a')).toContain('min-height: var(--target)');
  expect(rule('.skip-link,\n  .jump,\n  .rec__remind')).toContain('display: none');
});
