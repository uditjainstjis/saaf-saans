/**
 * The air report arranged for the page: band in words and symbol, pollutant
 * names and clock times composed here, so the page only places text.
 * Used by features/plan/view.ts.
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
}

const hourView = ({ hour, pm25 }: HourReading): HourView => ({ time: clock(hour), pm25 });

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
  };
}
