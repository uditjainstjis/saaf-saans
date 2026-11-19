// @ts-check
/** DOM helpers: typed lookup, template cloning and text-only element building. */

/**
 * The element with this id, checked to be a `type`. Every id is in
 * index.html, so a miss is a bug and fails loudly.
 * @template {HTMLElement} T
 * @param {string} id
 * @param {new () => T} type
 * @returns {T}
 */
export function $(id, type) {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`#${id} is missing or is not a ${type.name}`);
  return el;
}

/**
 * The element matching `selector` under `root`, checked to be a `type`.
 * @template {HTMLElement} T
 * @param {ParentNode} root
 * @param {string} selector
 * @param {new () => T} type
 * @returns {T}
 */
export function part(root, selector, type) {
  const el = root.querySelector(selector);
  if (!(el instanceof type)) throw new Error(`${selector} is missing or is not a ${type.name}`);
  return el;
}

/**
 * A fresh copy of a template's first element.
 * @param {HTMLTemplateElement} template
 * @returns {HTMLElement}
 */
export function cloneTemplate(template) {
  const el = template.content.firstElementChild?.cloneNode(true);
  if (!(el instanceof HTMLElement)) throw new Error(`#${template.id} is empty`);
  return el;
}

/**
 * A new element holding text. Content is always set as text, never parsed as
 * markup, so nothing a model or a visitor wrote can become HTML.
 * @param {string} tag
 * @param {string} content
 * @param {string} [className]
 * @returns {HTMLElement}
 */
export function textEl(tag, content, className = '') {
  const el = document.createElement(tag);
  el.textContent = content;
  el.className = className;
  return el;
}

/**
 * Tell assistive technology what just happened, through the polite live region.
 * @param {string} message
 */
export function announce(message) {
  $('status', HTMLElement).textContent = message;
}
