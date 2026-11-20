/**
 * WCAG 2.2 checks on page structure: language, title, headings, landmarks,
 * skip link and section names (1.3.1, 2.4.1, 2.4.2, 2.4.6, 3.1.1).
 */
import { beforeAll, expect, it } from 'vitest';
import { all, html } from '../support/markup.dom';
import { mountPage } from '../support/page.dom';
beforeAll(() => {
  mountPage();
});

it('declares its language and a descriptive title', () => {
  expect(html).toMatch(/<html lang="en">/);
  expect(document.title).toContain('Saaf Saans');
});

it('has exactly one h1, and headings that never skip a level', () => {
  expect(all('h1')).toHaveLength(1);
  const template = document.querySelector('template')?.content.querySelectorAll('h4') ?? [];
  expect(template.length).toBe(1);
  const levels = all('h1, h2, h3, h4').map((h) => Number(h.tagName.slice(1)));
  levels.forEach((level, i) => {
    expect(level - (levels[i - 1] ?? 0), `heading ${i}`).toBeLessThanOrEqual(1);
  });
});

it('has one header, one main and one footer landmark, with all content inside them', () => {
  expect(all('header')).toHaveLength(1);
  expect(all('main')).toHaveLength(1);
  expect(all('footer')).toHaveLength(1);
  const outside = [...document.body.children].filter(
    (el) => !['HEADER', 'MAIN', 'FOOTER', 'TEMPLATE'].includes(el.tagName),
  );
  expect(outside.map((el) => el.className)).toEqual(['skip-link']);
});

it('starts with a skip link to the main content', () => {
  const first = document.body.firstElementChild;
  expect(first?.getAttribute('href')).toBe('#main');
  expect(document.getElementById('main')?.tagName).toBe('MAIN');
});

it('names every section by its heading', () => {
  for (const section of all('section, form')) {
    const id = section.getAttribute('aria-labelledby') ?? '';
    expect(
      document.getElementById(id)?.textContent,
      `<${section.tagName} #${section.id}>`,
    ).toBeTruthy();
  }
});

it('uses the brief’s own phrases as section names', () => {
  const text = document.body.textContent.replace(/\s+/g, ' ');
  for (const phrase of [
    'GenAI-powered assistant',
    'Families and communities',
    'Severe winter smog and urban air pollution',
    'Low-emission daily routines',
    'Indoor air quality hacks',
    'Sustainable alternatives',
    'Tailored to your location',
    'Tailored to your lifestyle',
    'The direct impact of your choices',
  ]) {
    expect(text, phrase).toContain(phrase);
  }
});
