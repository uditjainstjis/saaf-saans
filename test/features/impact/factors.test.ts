/**
 * Tests for the factor table: every factor is labelled and sourced, and the
 * published figures are exactly as their sources print them.
 */
import { expect, it } from 'vitest';
import { FACTORS, factorsFor } from '../../../src/features/impact/factors';

it('labels every factor as published or assumption, with a source', () => {
  for (const factor of Object.values(FACTORS)) {
    expect(['published', 'assumption']).toContain(factor.kind);
    expect(factor.source.length).toBeGreaterThan(10);
    expect(factor.label.length).toBeGreaterThan(3);
    expect(Number.isFinite(factor.value)).toBe(true);
  }
});

it('holds the published figures exactly as their sources print them', () => {
  // US EPA Exposure Factors Handbook 2011, Table 6-2, 21 to <31 years, mean,
  // m³/minute × 60: sleep 4.3E-03, sedentary 4.2E-03, light 1.2E-02, moderate 2.6E-02.
  expect(FACTORS.breathingSleep.value).toBeCloseTo(4.3e-3 * 60, 2);
  expect(FACTORS.breathingRest.value).toBeCloseTo(4.2e-3 * 60, 2);
  expect(FACTORS.breathingLight.value).toBeCloseTo(1.2e-2 * 60, 2);
  expect(FACTORS.breathingActive.value).toBeCloseTo(2.6e-2 * 60, 2);
  // DESNZ 2024, Business travel – land: average petrol car 0.1645, average
  // motorbike 0.11367, average local bus 0.10846, light rail and tram 0.0286.
  expect(FACTORS.carCo2e.value).toBe(0.1645);
  expect(FACTORS.twoWheelerCo2e.value).toBe(0.1137);
  expect(FACTORS.busCo2e.value).toBe(0.1085);
  expect(FACTORS.metroCo2e.value).toBe(0.0286);
  // Akagi et al. 2011, Table 2: garbage burning PM2.5 9.8 g/kg, CO2 1453 g/kg;
  // open cooking PM2.5 6.64 g/kg.
  expect(FACTORS.wasteBurnPm.value).toBe(9.8);
  expect(FACTORS.wasteBurnCo2.value).toBe(1.453);
  expect(FACTORS.woodCookPm.value).toBe(6.64);
  // US EPA 2024 fact sheet: sensitive groups from 35.5 µg/m³, everyone from 55.5 µg/m³.
  expect(FACTORS.sensitiveLimit.value).toBe(35.4);
  expect(FACTORS.generalLimit.value).toBe(55.4);
});

it('marks modelling choices as assumptions, never as published', () => {
  for (const id of ['groupUptake', 'maskFit', 'sealingGain', 'woodPerDay'] as const) {
    expect(FACTORS[id].kind).toBe('assumption');
  }
  // The threshold for protective steps follows the WHO 24-hour level, but is this project's choice.
  expect(FACTORS.whoDaily).toMatchObject({ value: 15, kind: 'assumption' });
});

it('looks factors up by id and ignores ids it does not know', () => {
  expect(factorsFor(['carCo2e', 'metroCo2e']).map((f) => f.value)).toEqual([0.1645, 0.0286]);
  expect(factorsFor(['nope'])).toEqual([]);
});
