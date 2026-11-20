/**
 * Tests for what public/index.html loads: one module script, its stylesheets,
 * nothing inline and nothing third-party.
 */
import { beforeAll, expect, it } from 'vitest';
import { html } from '../support/markup.dom';
import { mountPage } from '../support/page.dom';
beforeAll(() => {
  mountPage();
});

it('has one module script, four stylesheets, no inline script or style, no third-party origin', () => {
  expect([...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0])).toEqual([
    '<script type="module" src="/js/main.js">',
  ]);
  expect([...html.matchAll(/<link rel="stylesheet"/g)]).toHaveLength(4);
  expect(html).not.toMatch(/<style\b|\sstyle=/);
  expect(html).not.toMatch(/https?:\/\//);
});
