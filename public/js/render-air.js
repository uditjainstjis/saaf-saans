// @ts-check
/** Renders the air card: the AQI band in words and symbol, readings, and the hourly table. */
import { $, textEl } from './dom.js';
import { formatNumber } from './shared/limits.js';

/** @typedef {import('../../src/features/plan/view').PlanView} PlanView */

/** @param {number} value */
const micrograms = (value) => `${formatNumber(value)} µg/m³`;

/** @param {{ time: string, pm25: number }} hour */
const hourText = (hour) => `${hour.time} (${micrograms(hour.pm25)})`;

/**
 * Fill the air card from a plan reply.
 * @param {PlanView} view
 */
export function renderAir({ place, air, advisory }) {
  $('air-place', HTMLElement).textContent = place.region
    ? `${place.name}, ${place.region}`
    : place.name;
  $('air-band', HTMLElement).className = `band band--${air.band.key}`;
  $('air-symbol', HTMLElement).textContent = air.band.symbol;
  $('air-aqi', HTMLElement).textContent = formatNumber(air.aqi);
  $('air-label', HTMLElement).textContent = air.band.label;
  $('air-advisory', HTMLElement).textContent = advisory;
  $('air-pm25', HTMLElement).textContent = micrograms(air.pm25);
  $('air-pm10', HTMLElement).textContent = micrograms(air.pm10);
  $('air-dominant', HTMLElement).textContent = air.dominant;
  $('air-best', HTMLElement).textContent = hourText(air.best);
  $('air-worst', HTMLElement).textContent = hourText(air.worst);
  $('air-source', HTMLElement).textContent =
    air.source === 'live'
      ? 'Live reading from the Open-Meteo Air Quality API.'
      : 'Live data is unavailable right now, so these are typical winter values for this area, not a measurement.';
  $('air-hours', HTMLElement).replaceChildren(
    ...air.hours.map((hour) => {
      const row = document.createElement('tr');
      const header = textEl('th', hour.time);
      header.setAttribute('scope', 'row');
      row.append(header, textEl('td', formatNumber(hour.pm25)));
      return row;
    }),
  );
}
