/**
 * WCAG 2.2 checks on the form: labels, ids, groups, input purpose and button
 * names (1.3.1, 1.3.5, 3.3.2, 4.1.2).
 */
import { beforeAll, expect, it } from 'vitest';
import { all } from '../support/markup.dom';
import { mountPage } from '../support/page.dom';
beforeAll(() => {
  mountPage();
});

const controls = (): Element[] => all('input, select, textarea');

it('gives every control exactly one visible label', () => {
  for (const control of controls()) {
    expect(all(`label[for="${control.id}"]`), `#${control.id}`).toHaveLength(1);
  }
  expect(controls().length).toBeGreaterThanOrEqual(15);
});

it('has unique ids, and every aria reference points at a real element', () => {
  const ids = all('[id]').map((el) => el.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const el of all('[aria-describedby], [aria-labelledby]')) {
    const refs = `${el.getAttribute('aria-describedby') ?? ''} ${el.getAttribute('aria-labelledby') ?? ''}`;
    for (const ref of refs.trim().split(/\s+/)) {
      expect(document.getElementById(ref), `${el.id} → ${ref}`).not.toBeNull();
    }
  }
});

it('groups related controls in fieldsets, each with a legend', () => {
  expect(all('fieldset')).toHaveLength(5);
  for (const fieldset of all('fieldset')) {
    expect(fieldset.firstElementChild?.tagName, fieldset.id).toBe('LEGEND');
  }
  for (const radio of all('input[type="radio"]')) expect(radio.closest('fieldset')).not.toBeNull();
});

it('declares autocomplete and input purpose where there is one', () => {
  expect(document.getElementById('place')?.getAttribute('autocomplete')).toBe('address-level2');
  expect(document.getElementById('notes')?.getAttribute('autocomplete')).toBe('off');
  for (const number of all('input[type="number"]')) {
    expect(number.getAttribute('inputmode'), number.id).toMatch(/numeric|decimal/);
  }
});

it('never uses a placeholder as a label', () => {
  expect(all('[placeholder]')).toEqual([]);
});

it('gives every button a type and a text name', () => {
  for (const button of all('button')) {
    expect(button.getAttribute('type'), button.id).toMatch(/submit|button/);
    expect(button.textContent.trim(), button.id).not.toBe('');
  }
});
