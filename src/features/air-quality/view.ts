/**
 * The air report arranged for the page: band in words and symbol, pollutant
 * names, clock times and the time of the reading composed here, so the page
 * only places text. Used by features/plan/view.ts.
 */

import { bandFor, POLLUTANT_LABEL } from './aqi';
import { clock, outlookFor } from './forecast';
import type { AirReport, HourReading } from './types';

/** An hour of the forecast as the page shows it: a clock time and PM2.5. */
export interface HourView {
  time: string;
  pm25: number;
}

/** An air report as the page shows it. */
export interface AirView {
  source: AirReport['source'];
  aqi: number;
  band: { key: string; label: string; symbol: string };
  pm25: number;
  pm10: number;
  dominant: string;
  best: HourView;
  worst: HourView;
  hours: HourView[];
  /** When a live reading was taken, in the place's local time: "3:45 pm on 20 Nov". */
  takenAt?: string;
}

const hourView = ({ hour, pm25 }: HourReading): HourView => ({ time: clock(hour), pm25 });

/** Month names, three letters each, in calendar order. */
const MONTHS = 'JanFebMarAprMayJunJulAugSepOctNovDec';

/** A checked local date and time, "2026-11-20T15:45", as people say it: "3:45 pm on 20 Nov". */
function spokenTime(stamp: string): string {
  const hour = Number(stamp.slice(11, 13));
  const month = Number(stamp.slice(5, 7));
  const time = `${String(hour % 12 || 12)}:${stamp.slice(14, 16)} ${hour < 12 ? 'am' : 'pm'}`;
  return `${time} on ${String(Number(stamp.slice(8, 10)))} ${MONTHS.slice(month * 3 - 3, month * 3)}`;
}

/** The page's view of an air report. */
export function airView(air: AirReport): AirView {
  const { key, label, symbol } = bandFor(air.aqi);
  const { best, worst } = outlookFor(air.hours);
  return {
    source: air.source,
    aqi: air.aqi,
    band: { key, label, symbol },
    pm25: air.pm25,
    pm10: air.pm10,
    dominant: POLLUTANT_LABEL[air.dominant],
    best: hourView(best),
    worst: hourView(worst),
    hours: air.hours.map(hourView),
    ...(air.observedAt ? { takenAt: spokenTime(air.observedAt) } : {}),
  };
}
