// @ts-check
/** The light/dark toggle. Light is the default; a choice is remembered on this device. */
import { $ } from './dom.js';

const KEY = 'saaf-saans-theme';

/** The remembered theme, or light when storage is unavailable or empty. */
function stored() {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Apply a theme to the page and to the toggle's state and label.
 * @param {'light' | 'dark'} theme
 */
function apply(theme) {
  const toggle = $('theme-toggle', HTMLButtonElement);
  document.documentElement.dataset.theme = theme;
  toggle.setAttribute('aria-pressed', String(theme === 'dark'));
}

/** Restore the remembered theme and wire up the toggle. */
export function initTheme() {
  apply(stored());
  $('theme-toggle', HTMLButtonElement).addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Private browsing: the theme still applies for this visit.
    }
  });
}
