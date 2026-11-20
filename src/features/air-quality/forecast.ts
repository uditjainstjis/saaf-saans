/**
 * Reading the 24-hour forecast: the cleanest and dirtiest hours, the reading
 * at a given hour, and clock times for people. The report type is ./types.ts.
 */

import type { AirReport, HourReading } from './types';

/** The cleanest and the dirtiest hour of the next day. */
export interface Outlook {
  best: HourReading;
  worst: HourReading;
}

/** The cleanest and dirtiest hours in a forecast; the earlier hour wins a tie. */
export function outlookFor(hours: AirReport['hours']): Outlook {
  const [first, ...rest] = hours;
  return rest.reduce<Outlook>(
    ({ best, worst }, reading) => ({
      best: reading.pm25 < best.pm25 ? reading : best,
      worst: reading.pm25 > worst.pm25 ? reading : worst,
    }),
    { best: first, worst: first },
  );
}

/** The forecast for a local hour of day, or the current hour when the forecast is short. */
export function readingAt(hours: AirReport['hours'], hour: number): HourReading {
  return hours.find((reading) => reading.hour === hour) ?? hours[0];
}

/** A local hour as a 12-hour clock time, "7 am" or "12 noon". */
export function clock(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return '12 midnight';
  if (h === 12) return '12 noon';
  return h < 12 ? `${h} am` : `${h - 12} pm`;
}
