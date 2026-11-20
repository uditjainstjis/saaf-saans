/**
 * A Google Calendar link for advice that names a clock time: a pure function
 * from the advice, the date at the place and its time zone to one URL, which
 * opens Calendar with an event filled in for the next day. It is only a link:
 * nothing is loaded from Google and no key is involved. Offered by ./view.ts.
 */
import { dayAfter } from '../../lib/clock';
import type { LocalDay } from '../air-quality/types';
import type { Recommendation, When } from './types';

const CALENDAR_URL = 'https://calendar.google.com/calendar/render';
const DAY_MINUTES = 1440;

const two = (n: number): string => String(n).padStart(2, '0');

/** A minute of a day as Calendar writes a local time, "20261121T150000". */
const stamp = (date: string, minute: number): string =>
  `${date.replaceAll('-', '')}T${two(Math.floor(minute / 60))}${two(minute % 60)}00`;

/** Start and end on the day after `today`, in Calendar's `dates` form; an end at or past midnight falls on the day after that. */
function datesFor({ hour, minutes }: When, today: string): string {
  const tomorrow = dayAfter(today);
  const start = (((hour % 24) + 24) % 24) * 60;
  const end = start + minutes;
  const endDay = end < DAY_MINUTES ? tomorrow : dayAfter(tomorrow);
  return `${stamp(tomorrow, start)}/${stamp(endDay, end % DAY_MINUTES)}`;
}

/** What a reminder is made from: the advice's words and its time of day. */
export type Timed = Pick<Recommendation, 'title' | 'action'> & { when: When };

/** The link that opens Google Calendar with this advice as tomorrow's event, at the place's local time. */
export function calendarUrl({ title, action, when }: Timed, { date, timeZone }: LocalDay): string {
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesFor(when, date),
    ctz: timeZone,
    // The hour is today's forecast, carried to tomorrow as a habit: the note says so.
    details: `${action} This time comes from the forecast of ${date}; the cleanest and dirtiest hours move from day to day, so check Saaf Saans again.`,
  });
  return `${CALENDAR_URL}?${query.toString()}`;
}
