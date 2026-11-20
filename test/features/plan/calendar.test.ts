/**
 * Tests for the Google Calendar link: the exact URL for one piece of advice,
 * how times wrap around midnight, and that whatever the title holds is
 * encoded, never interpreted.
 */
import { expect, it } from 'vitest';
import { calendarUrl } from '../../../src/features/plan/calendar';
import { DELHI_DAY } from '../../support/fixtures';

const airing = {
  title: 'Open windows at 3 pm, not at dawn',
  action: 'Air rooms for half an hour around 3 pm.',
  when: { hour: 15, minutes: 30 },
};
/** The `dates` value of the link for advice at this time, read on this date. */
const dates = (when: { hour: number; minutes: number }, date: string = DELHI_DAY.date) =>
  new URL(calendarUrl({ ...airing, when }, { ...DELHI_DAY, date })).searchParams.get('dates');

it('builds the exact link for airing at 3 pm, read in Delhi on 20 November', () => {
  expect(calendarUrl(airing, DELHI_DAY)).toBe(
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=Open+windows+at+3+pm%2C+not+at+dawn' +
      '&dates=20261121T150000%2F20261121T153000' +
      '&ctz=Asia%2FKolkata' +
      '&details=Air+rooms+for+half+an+hour+around+3+pm.+This+time+comes+from+the+forecast+of+2026-11-20%3B' +
      '+the+cleanest+and+dirtiest+hours+move+from+day+to+day%2C+so+check+Saaf+Saans+again.',
  );
});

it('sets the event on the day after the report, in the place’s own time zone', () => {
  const url = new URL(calendarUrl(airing, { timeZone: 'America/New_York', date: '2026-12-31' }));
  expect(url.searchParams.get('dates')).toBe('20270101T150000/20270101T153000');
  expect(url.searchParams.get('ctz')).toBe('America/New_York');
  expect(url.searchParams.get('text')).toBe(airing.title);
  expect([...url.searchParams.keys()]).toEqual(['action', 'text', 'dates', 'ctz', 'details']);
});

it('ends on the following day when the time runs to midnight or past it', () => {
  expect(dates({ hour: 21, minutes: 180 })).toBe('20261121T210000/20261122T000000');
  expect(dates({ hour: 23, minutes: 180 })).toBe('20261121T230000/20261122T020000');
  expect(dates({ hour: 23, minutes: 45 }, '2026-11-29')).toBe('20261130T230000/20261130T234500');
});

it('wraps an hour outside 0 to 23 as a clock does', () => {
  // The peak strategy starts one hour before the worst hour: midnight gives -1, which is 11 pm.
  expect(dates({ hour: -1, minutes: 180 })).toBe('20261121T230000/20261122T020000');
  expect(dates({ hour: 24, minutes: 30 })).toBe('20261121T000000/20261121T003000');
});

it('encodes the title and the action, so neither can add a parameter', () => {
  const sly = { ...airing, title: 'A&add=x@example.com#frag', action: 'B&src=y?z' };
  const url = new URL(calendarUrl(sly, DELHI_DAY));
  expect(url.searchParams.get('text')).toBe(sly.title);
  expect(url.searchParams.get('details')).toMatch(/^B&src=y\?z This time comes from/);
  expect(url.searchParams.get('add')).toBeNull();
  expect(url.hash).toBe('');
  expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
});
