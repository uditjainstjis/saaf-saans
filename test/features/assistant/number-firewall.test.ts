/**
 * Tests for the number firewall: which numerals are read, and which are
 * reported as not coming from the facts.
 */
import { expect, it } from 'vitest';
import { numbersIn, unsupportedNumbers } from '../../../src/features/assistant/number-firewall';

it('finds numerals and normalises separators and trailing zeros', () => {
  expect(numbersIn('about 1,593.20 µg, 32.6 kg and 7 am')).toEqual(['1593.2', '32.6', '7']);
});

it('does not read pollutant and product names as quantities', () => {
  expect(numbersIn('PM2.5, PM10, pm2.5, an N95 mask, CO2, CO2e and MERV-13 filters')).toEqual([]);
  expect(numbersIn('PM 2.5, PM-10, an N-95 mask and a MERV 13 filter')).toEqual([]);
});

it('still reads a quantity that follows a name', () => {
  expect(numbersIn('PM2.5 is 149 and PM10 is 210')).toEqual(['149', '210']);
  expect(numbersIn('PM2.57 CO25')).toEqual(['2.57', '25']);
});

it('returns nothing for text with no digits', () => {
  expect(numbersIn('breathe easy')).toEqual([]);
});

const allowed = new Set(['149', '468', '3']);

it('passes text whose every numeral was in the facts', () => {
  expect(unsupportedNumbers('At 3 pm you avoid 468 µg; PM2.5 is 149.', allowed)).toEqual([]);
});

it('names each numeral the facts did not contain', () => {
  expect(unsupportedNumbers('You will live 10 years longer and save 99%.', allowed)).toEqual([
    '10',
    '99',
  ]);
});
