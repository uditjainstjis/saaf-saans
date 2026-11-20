/**
 * Tests for public/js/dom.js: the helpers fail loudly instead of rendering
 * into nothing, and text is always set as text.
 */
import { beforeEach, expect, it } from 'vitest';
import { $, announce, cloneTemplate, part, textEl } from '../../public/js/dom.js';

beforeEach(() => {
  document.body.innerHTML =
    '<p id="status"></p><div id="box"><span class="inner">x</span></div>' +
    '<template id="full"><li>item</li></template><template id="empty"></template>';
});

it('$ returns the element when it is the expected kind', () => {
  expect($('box', HTMLDivElement).id).toBe('box');
});

it('$ throws for a missing id or the wrong kind of element', () => {
  expect(() => $('nope', HTMLElement)).toThrow('#nope is missing');
  expect(() => $('box', HTMLInputElement)).toThrow('is not a HTMLInputElement');
});

it('part finds a descendant, and throws when it is absent', () => {
  const box = $('box', HTMLDivElement);
  expect(part(box, '.inner', HTMLSpanElement).textContent).toBe('x');
  expect(() => part(box, '.absent', HTMLElement)).toThrow('.absent is missing');
});

it('cloneTemplate copies the first element, and throws for an empty template', () => {
  const copy = cloneTemplate($('full', HTMLTemplateElement));
  expect(copy.tagName).toBe('LI');
  expect(copy.isConnected).toBe(false);
  expect(() => cloneTemplate($('empty', HTMLTemplateElement))).toThrow('#empty is empty');
});

it('textEl sets content as text, so markup in it is inert', () => {
  const el = textEl('p', '<b>bold</b>', 'note');
  expect(el.children).toHaveLength(0);
  expect(el.textContent).toBe('<b>bold</b>');
  expect(el.className).toBe('note');
  expect(textEl('p', 'plain').className).toBe('');
});

it('announce writes to the live region', () => {
  announce('Ready');
  expect($('status', HTMLElement).textContent).toBe('Ready');
});
