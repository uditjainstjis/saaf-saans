/**
 * axe-core over the form in every state, in both themes: empty, community
 * mode, and with errors shown. Also proves the audit can fail (a negative
 * control) and that it ran a meaningful number of rules.
 */
import axe from 'axe-core';
import { afterEach, expect, it, vi } from 'vitest';
import { AXE_OPTIONS, openIn, violations } from '../support/axe.dom';
import { THEMES } from '../support/contrast.dom';
import { byId, chooseCommunity, inputEl, mountPage, submit } from '../support/page.dom';
import { stubFetch } from '../support/replies.dom';

afterEach(() => {
  vi.unstubAllGlobals();
});

it.each(THEMES)('finds nothing in the empty form (%s theme)', async (theme) => {
  await openIn(theme);
  expect(await violations()).toBe('');
});

it.each(THEMES)('finds nothing in the community form (%s theme)', async (theme) => {
  await openIn(theme);
  chooseCommunity();
  expect(await violations()).toBe('');
});

it.each(THEMES)('finds nothing with the error summary shown (%s theme)', async (theme) => {
  await openIn(theme);
  stubFetch();
  inputEl('adults').value = '99';
  submit();
  expect(byId('error-summary').hidden).toBe(false);
  expect(await violations()).toBe('');
});

it('NEGATIVE CONTROL: catches an unlabelled input and an image with no alternative', async () => {
  mountPage(true);
  document.body.insertAdjacentHTML(
    'afterbegin',
    '<main><img src="x.png"><input type="text"></main>',
  );
  const found = await violations();
  expect(found).toContain('image-alt');
  expect(found).toContain('label');
});

it('ran a meaningful number of rules, rather than passing an empty page', async () => {
  mountPage(true);
  const results = await axe.run(document, AXE_OPTIONS);
  expect(results.passes.length).toBeGreaterThan(25);
});
