// @ts-check
/**
 * How the form reports problems: a summary at the top that takes focus and
 * links to each field, and the same message beside the field, which is marked
 * invalid and described by it (WCAG 3.3.1, 3.3.3).
 */
import { $ } from './dom.js';

/** @typedef {import('./form.js').Issue} Issue */

/** Remove every error from the form. */
export function clearIssues() {
  $('error-summary', HTMLElement).hidden = true;
  $('error-list', HTMLElement).replaceChildren();
  for (const el of document.querySelectorAll('[aria-invalid="true"]')) {
    el.removeAttribute('aria-invalid');
  }
  for (const el of document.querySelectorAll('.field-error')) el.textContent = '';
}

/**
 * One line of the summary: a link to the field when the issue names one that
 * exists, else plain text.
 * @param {Issue} issue
 * @returns {HTMLElement}
 */
function summaryItem({ field, message }) {
  const item = document.createElement('li');
  const control = document.getElementById(field);
  if (!control) {
    item.textContent = message;
    return item;
  }
  const link = document.createElement('a');
  link.href = `#${field}`;
  link.textContent = message;
  link.addEventListener('click', (event) => {
    event.preventDefault();
    control.focus();
  });
  item.append(link);
  control.setAttribute('aria-invalid', 'true');
  const slot = document.getElementById(`${field}-error`);
  if (slot) slot.textContent = message;
  return item;
}

/**
 * Show issues in the summary and beside their fields, and move focus to the summary.
 * @param {ReadonlyArray<Issue>} issues
 */
export function showIssues(issues) {
  clearIssues();
  const summary = $('error-summary', HTMLElement);
  $('error-list', HTMLElement).replaceChildren(...issues.map(summaryItem));
  summary.hidden = false;
  summary.focus();
}

/**
 * A single problem that belongs to no field.
 * @param {string} message
 * @returns {Issue[]}
 */
export const formIssue = (message) => [{ field: 'form', message }];
