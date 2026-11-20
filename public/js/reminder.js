// @ts-check
/**
 * The "Add a reminder to Google Calendar" link on a recommendation card. It
 * is a plain link the Worker built; nothing is loaded from Google.
 */
import { part } from './dom.js';

/** The only place a reminder may lead. Anything else the page was sent is not made a link. */
const CALENDAR = 'https://calendar.google.com/calendar/render?';

/**
 * Show a card's reminder link when its recommendation carries one. Every such
 * link has the same words, so its name adds the card's title after them (SC 2.5.3).
 * @param {HTMLElement} card
 * @param {{ title: string, calendarUrl?: string }} rec
 */
export function showReminder(card, { title, calendarUrl }) {
  if (!calendarUrl?.startsWith(CALENDAR)) return;
  const link = part(card, '.rec__remind', HTMLAnchorElement);
  link.href = calendarUrl;
  link.setAttribute('aria-label', `${link.text.trim()}: ${title} (opens in a new tab)`);
  link.hidden = false;
}
